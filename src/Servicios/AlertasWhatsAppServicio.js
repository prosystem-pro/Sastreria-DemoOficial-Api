const cron = require('node-cron');
const axios = require('axios');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { PedidoModelo, ClienteModelo, EmpresaModelo, EstadoPedidoModelo } = require('../Relaciones/Relaciones');
const { FormatoFecha } = require('../Utilidades/ConversionFechas');

const ZONA_GUATEMALA = 'America/Guatemala';

const TOKEN = process.env.WHATSAPP_TOKEN;
const ID_TELEFONO = process.env.WHATSAPP_ID_TELEFONO;
const WABA_ID = process.env.WHATSAPP_ID_CUENTA;
const LISTA_NUMEROS_DESTINO = process.env.WHATSAPP_NUMERO_DESTINO
    ? process.env.WHATSAPP_NUMERO_DESTINO.split(',').map(num => num.trim())
    : [];
const VERSAO = process.env.WHATSAPP_VERSAO_API || 'v21.0';
const CODIGO_IDIOMA = 'en';

const NOMBRE_PLANTILLA_INICIO  = 'alerta_inicio';
const NOMBRE_PLANTILLA_EMPRESA = 'alerta_empresa';
const NOMBRE_PLANTILLA_PEDIDO  = 'alerta_pedido';
const NOMBRE_PLANTILLA_CIERRE  = 'alerta_cierre';

// ⏰ Tiempo de envío
// const HORA_ENVIO = '0 0 */3 * * *';  // Producción: cada 3 días
const HORA_ENVIO = '*/1 * * * *';       // Pruebas: cada 5 minutos

const Sanitizar = (texto) => texto ? String(texto).replace(/[\r\n\t]+/g, ' ').trim() : '';

const DiagnosticarPlantillas = async () => {
    if (!WABA_ID) return console.warn('⚠️ Falta WHATSAPP_ID_CUENTA');
    try {
        const { data } = await axios.get(
            `https://graph.facebook.com/${VERSAO}/${WABA_ID}/message_templates`,
            { headers: { Authorization: `Bearer ${TOKEN}` }, params: { fields: 'name,status', limit: 100 } }
        );
    } catch (err) {
        console.warn('⚠️ No se pudo verificar plantillas');
    }
};

const EnviarPlantilla = async (nombre, parametros, numero) => {
    try {
        const template = { name: nombre, language: { code: CODIGO_IDIOMA } };
        if (parametros?.length) {
            template.components = [{
                type: 'body',
                parameters: parametros.map(p => ({
                    type: 'text',
                    parameter_name: p.nombre,
                    text: Sanitizar(p.valor)
                }))
            }];
        }
        await axios.post(
            `https://graph.facebook.com/${VERSAO}/${ID_TELEFONO}/messages`,
            { messaging_product: 'whatsapp', to: numero, type: 'template', template },
            { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } }
        );
        return true;
    } catch (err) {
        console.error(`❌ Fallo en "${nombre}":`, err.response?.data?.error?.message || err.message);
        return false;
    }
};

const EnviarSecuenciaAlerta = async (fecha, cantidad, alertas, destino) => {
    const numero = destino.replace(/\D/g, '');
    if (!numero) return console.error('❌ Número inválido'), false;

    await EnviarPlantilla(NOMBRE_PLANTILLA_INICIO, [
        { nombre: 'fecha', valor: fecha },
        { nombre: 'cantidad', valor: String(cantidad) }
    ], numero);

    const empresas = {};
    alertas.forEach(a => (empresas[a.Empresa] || (empresas[a.Empresa] = [])).push(a));

    for (const [nombreEmpresa, pedidos] of Object.entries(empresas)) {
        await EnviarPlantilla(NOMBRE_PLANTILLA_EMPRESA, [
            { nombre: 'empresa', valor: `*${nombreEmpresa}*` }
        ], numero);

        for (const p of pedidos) {
            const estadoTexto = p.Etiqueta.includes('VENCIDO')
                ? `⚠️ ${p.Etiqueta}`
                : p.Etiqueta;

            await EnviarPlantilla(NOMBRE_PLANTILLA_PEDIDO, [
                { nombre: 'cliente', valor: p.Cliente },
                { nombre: 'entrega', valor: p.Entrega },
                { nombre: 'estado', valor: estadoTexto },
                { nombre: 'codigo', valor: String(p.Codigo) }
            ], numero);
        }
    }

    await EnviarPlantilla(NOMBRE_PLANTILLA_CIERRE, [], numero);
    return true;
};

const CalcularEstado = (fechaDB, hoy) => {
    const [a, m, d] = String(fechaDB).substring(0, 10).split('-').map(Number);
    const entrega = DateTime.fromObject({ year: a, month: m, day: d }, { zone: ZONA_GUATEMALA }).startOf('day');
    const dias = Math.round((entrega - hoy) / 86400000);
    if (dias > 0) return { dias, etiqueta: dias === 1 ? 'Falta 1 DÍA' : `Faltan ${dias} DÍAS` };
    if (dias === 0) return { dias: 0, etiqueta: 'VENCE HOY' };
    const v = Math.abs(dias);
    return { dias, etiqueta: v === 1 ? 'VENCIDO hace 1 DÍA' : `VENCIDO hace ${v} DÍAS` };
};

const Revisar = async () => {
    try {
        const hoy = DateTime.now().setZone(ZONA_GUATEMALA);
        const fechaHoy = hoy.toFormat('dd/MM/yyyy');

        const pedidos = await PedidoModelo.findAll({
            where: { Estatus: { [Op.in]: [1, 2, 3, 4] }, FechaEntrega: { [Op.ne]: null } },
            attributes: ['CodigoPedido', 'FechaEntrega', 'CodigoEmpresa', 'CodigoEstadoPedido'],
            include: [
                { model: ClienteModelo, as: 'CaCliente', attributes: ['NombreCliente'] },
                { model: EmpresaModelo, as: 'AdEmpresa', attributes: ['NombreEmpresa'] },
                { model: EstadoPedidoModelo, as: 'CaEstadoPedido', attributes: ['NombreEstadoPedido'] }
            ]
        });

        const alertas = [];
        for (const p of pedidos) {
            if ((p.CaEstadoPedido?.NombreEstadoPedido || '').toUpperCase() === 'ENTREGADO') continue;
            const estado = CalcularEstado(p.FechaEntrega, hoy);
            if (estado.dias <= 5) {
                alertas.push({
                    Codigo: p.CodigoPedido,
                    Cliente: p.CaCliente?.NombreCliente || 'Sin nombre',
                    Empresa: p.AdEmpresa?.NombreEmpresa || 'Sistema',
                    Entrega: FormatoFecha(p.FechaEntrega),
                    Etiqueta: estado.etiqueta,
                    dias: estado.dias
                });
            }
        }

        if (alertas.length) {
            alertas.sort((a, b) => a.dias - b.dias);
        
            for (const num of LISTA_NUMEROS_DESTINO) {
                await EnviarSecuenciaAlerta(fechaHoy, alertas.length, alertas, num);
            }
            console.log('✅ Notificación completado - WhatsApp');
        } else {
            console.log('✅ Sin pedidos próximos a vencer');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
};

const Iniciar = () => {
    const faltan = [];
    if (!TOKEN) faltan.push('WHATSAPP_TOKEN');
    if (!ID_TELEFONO) faltan.push('WHATSAPP_ID_TELEFONO');
    if (!WABA_ID) faltan.push('WHATSAPP_ID_CUENTA');
    if (!LISTA_NUMEROS_DESTINO.length) faltan.push('WHATSAPP_NUMERO_DESTINO');

    if (faltan.length) {
        return console.warn('⚠️ Faltan variables:', faltan.join(', '));
    }
    
    DiagnosticarPlantillas();
    cron.schedule(HORA_ENVIO, Revisar, { timezone: ZONA_GUATEMALA });
};

module.exports = { IniciarAlertasWhatsApp: Iniciar, RevisarPedidosPorVencer: Revisar };
