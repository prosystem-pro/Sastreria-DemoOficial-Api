const cron = require('node-cron');
const axios = require('axios');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { PedidoModelo, ClienteModelo, EmpresaModelo, EstadoPedidoModelo } = require('../Relaciones/Relaciones');
const { FormatoFecha } = require('../Utilidades/ConversionFechas');

const ZONA_GUATEMALA = 'America/Guatemala';

// ✅ Variables de entorno
const TOKEN = process.env.WHATSAPP_TOKEN;
const ID_TELEFONO = process.env.WHATSAPP_ID_TELEFONO;
const WABA_ID = process.env.WHATSAPP_ID_CUENTA;
const LISTA_NUMEROS_DESTINO = process.env.WHATSAPP_NUMERO_DESTINO
    ? process.env.WHATSAPP_NUMERO_DESTINO.split(',').map(num => num.trim())
    : [];
const VERSAO = process.env.WHATSAPP_VERSAO_API || 'v21.0';
const CODIGO_IDIOMA = 'en';

// ✅ Nombres de plantillas
const NOMBRE_PLANTILLA_INICIO = 'alerta_inicio';
const NOMBRE_PLANTILLA_EMPRESA = 'alerta_empresa';
const NOMBRE_PLANTILLA_PEDIDO = 'alerta_pedido';
const NOMBRE_PLANTILLA_CIERRE = 'alerta_cierre';

// ⏰ Tiempo de envío — cambia a la primera línea cuando termines pruebas
// const HORA_ENVIO = '0 0 */3 * * *';  // Producción: cada 3 días
const HORA_ENVIO = '*/5 * * * *'; // 5 min de prueba

// ==============================================
// 🧹 Utilidades
// ==============================================
const Sanitizar = (texto) => texto ? String(texto).replace(/[\r\n\t]+/g, ' ').trim() : '';

const DiagnosticarPlantillas = async () => {
    if (!WABA_ID) return console.warn('⚠️ Falta WHATSAPP_ID_CUENTA en .env');
    try {
        const { data } = await axios.get(
            `https://graph.facebook.com/${VERSAO}/${WABA_ID}/message_templates`,
            { headers: { Authorization: `Bearer ${TOKEN}` }, params: { fields: 'name,language,status', limit: 100 } }
        );
        console.log(`📋 Plantillas activas: ${data.data?.length || 0}`);
    } catch (err) {
        console.warn('⚠️ No se pudieron consultar plantillas:', err.response?.data?.error?.message || err.message);
    }
};

// ==============================================
// 📤 Enviar plantilla
// ==============================================
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
        console.log(`✅ Enviado: "${nombre}"`);
        return true;
    } catch (err) {
        console.error(`❌ Error "${nombre}":`, err.response?.data?.error?.message || err.message);
        return false;
    }
};

// ==============================================
// 📤 Secuencia completa
// ==============================================
const EnviarSecuenciaAlerta = async (fecha, cantidad, alertas, destino) => {
    const numero = destino.replace(/\D/g, '');
    if (!numero) return console.error('❌ Número inválido'), false;

    // 1️⃣ Inicio — una sola vez
    await EnviarPlantilla(NOMBRE_PLANTILLA_INICIO, [
        { nombre: 'fecha', valor: fecha },
        { nombre: 'cantidad', valor: String(cantidad) }
    ], numero);

    // Agrupar por empresa
    const empresas = {};
    alertas.forEach(a => (empresas[a.Empresa] || (empresas[a.Empresa] = [])).push(a));

    // 2️⃣ Por cada empresa → encabezado en negrita + pedidos
    for (const [nombreEmpresa, pedidos] of Object.entries(empresas)) {
        // Negrita: *texto* → WhatsApp lo muestra resaltado ✅
        await EnviarPlantilla(NOMBRE_PLANTILLA_EMPRESA, [
            { nombre: 'empresa', valor: `*${nombreEmpresa}*` }
        ], numero);

        // Cada pedido — formato limpio
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

    // 3️⃣ Cierre — una sola vez
    await EnviarPlantilla(NOMBRE_PLANTILLA_CIERRE, [], numero);
    return true;
};

// ==============================================
// 🔍 Calcular estado
// ==============================================
const CalcularEstado = (fechaDB, hoy) => {
    const [a, m, d] = String(fechaDB).substring(0, 10).split('-').map(Number);
    const entrega = DateTime.fromObject({ year: a, month: m, day: d }, { zone: ZONA_GUATEMALA }).startOf('day');
    const dias = Math.round((entrega - hoy) / 86400000);

    if (dias > 0) return { dias, etiqueta: dias === 1 ? 'Falta 1 DÍA' : `Faltan ${dias} DÍAS` };
    if (dias === 0) return { dias: 0, etiqueta: 'VENCE HOY' };
    const v = Math.abs(dias);
    return { dias, etiqueta: v === 1 ? 'VENCIDO hace 1 DÍA' : `VENCIDO hace ${v} DÍAS` };
};

// ==============================================
// 🔍 Revisar pedidos
// ==============================================
const Revisar = async () => {
    try {
        const hoy = DateTime.now().setZone(ZONA_GUATEMALA);
        const fechaHoy = hoy.toFormat('dd/MM/yyyy');
        console.log('\n🔍 Revisando:', fechaHoy);

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
            console.log(`📋 ${alertas.length} pedidos por vencer`);
            for (const num of LISTA_NUMEROS_DESTINO) {
                await EnviarSecuenciaAlerta(fechaHoy, alertas.length, alertas, num);
            }
        } else {
            console.log('✅ Sin pedidos próximos a vencer');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
};

// ==============================================
// 🚀 Iniciar servicio
// ==============================================
const Iniciar = () => {
    console.log('\n=============================================');
    console.log('   📱 ALERTAS WHATSAPP — INICIANDO');
    console.log('=============================================');

    const faltan = [];
    if (!TOKEN) faltan.push('WHATSAPP_TOKEN');
    if (!ID_TELEFONO) faltan.push('WHATSAPP_ID_TELEFONO');
    if (!WABA_ID) faltan.push('WHATSAPP_ID_CUENTA');
    if (!LISTA_NUMEROS_DESTINO.length) faltan.push('WHATSAPP_NUMERO_DESTINO');

    if (faltan.length) {
        return console.warn('⚠️ Faltan variables en .env:', faltan.join(', '));
    }

    console.log(`📱 Destinatarios: ${LISTA_NUMEROS_DESTINO.length}`);
    console.log(`🕐 Envío programado: cada minuto (pruebas)`);

    DiagnosticarPlantillas();
    cron.schedule(HORA_ENVIO, Revisar, { timezone: ZONA_GUATEMALA });
    console.log('✅ Servicio activo...\n');
};

module.exports = { IniciarAlertasWhatsApp: Iniciar, RevisarPedidosPorVencer: Revisar };
