const cron = require('node-cron');
const axios = require('axios');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { PedidoModelo, ClienteModelo, EmpresaModelo, EstadoPedidoModelo } = require('../Relaciones/Relaciones');
const { FormatoFecha } = require('../Utilidades/ConversionFechas');

const ZONA_GUATEMALA = 'America/Guatemala';
const TOKEN = process.env.WHATSAPP_TOKEN || '';
const ID_TELEFONO = process.env.WHATSAPP_ID_TELEFONO;
const LISTA_NUMEROS_DESTINO = process.env.WHATSAPP_NUMERO_DESTINO
    ? process.env.WHATSAPP_NUMERO_DESTINO.split(',').map(num => num.trim())
    : [];
const VERSAO = process.env.WHATSAPP_VERSAO_API || 'v21.0';

const HORA_ENVIO = '* * * * *';
const MODO_PRUEBA = TOKEN.trim().toUpperCase() === 'PRUEBA';

const EnviarTextoLibre = async (mensaje, numero) => {
    if (MODO_PRUEBA) {
        console.log('✅ [PRUEBA] Mensaje listo');
        console.log('────────────────────────────────────────────');
        console.log(mensaje);
        console.log('────────────────────────────────────────────\n');
        return { enviado: true, simulado: true };
    }
    try {
        const respuesta = await axios.post(
            `https://graph.facebook.com/${VERSAO}/${ID_TELEFONO}/messages`,
            {
                messaging_product: 'whatsapp',
                to: numero,
                text: { body: mensaje }
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
       // console.log(`✅ ENVIADO → ID: ${respuesta.data?.messages?.[0]?.id}`);
        console.log(`✅ ENVIADO`);
        return { enviado: true };
    } catch (err) {
        console.log('❌ ERROR:');
        console.log('   Datos:', JSON.stringify(err.response?.data || err.message, null, 2));
        return { enviado: false };
    }
};

const CalcularEstado = (fechaDB, hoy) => {
    const [a, m, d] = String(fechaDB).substring(0, 10).split('-').map(Number);
    const entrega = DateTime.fromObject({ year: a, month: m, day: d }, { zone: ZONA_GUATEMALA }).startOf('day');
    const dias = Math.round((entrega - hoy.startOf('day')) / 86400000);

    if (dias > 0) {
        const etiqueta = dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`;
        const color = dias === 1 ? '🟡' : '🟢';
        return { dias, etiqueta, color };
    }
    if (dias === 0) {
        return { dias: 0, etiqueta: 'Vence hoy', color: '🟠' };
    }
    const v = Math.abs(dias);
    const etiqueta = v === 1 ? 'Vencido hace 1 día' : `Vencido hace ${v} días`;
    return { dias, etiqueta, color: '🔴' };
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
                    Empresa: (p.AdEmpresa?.NombreEmpresa || 'Sistema').toUpperCase(),
                    Entrega: FormatoFecha(p.FechaEntrega),
                    Etiqueta: estado.etiqueta,
                    Color: estado.color,
                    dias: estado.dias
                });
            }
        }

        if (alertas.length) {
            alertas.sort((a, b) => a.dias - b.dias);
            const empresas = {};
            alertas.forEach(a => (empresas[a.Empresa] || (empresas[a.Empresa] = [])).push(a));

            for (const numeroDestino of LISTA_NUMEROS_DESTINO) {
                const numero = numeroDestino.replace(/\D/g, '');
                if (!numero) {
                    console.log(`⚠️ Número inválido: ${numeroDestino}`);
                    continue;
                }

                console.log(`\n📤 Enviando a: ${numero}`);
                let mensaje = `🚨 ALERTA DE VENCIMIENTO  ${fechaHoy}\n\n`;
                mensaje += `🔎 Se encontraron ${alertas.length} pedidos que requieren atención\n`;
                mensaje += `─────────────────\n\n`;
                for (const [nombreEmpresa, pedidosEmpresa] of Object.entries(empresas)) {
                    pedidosEmpresa.sort((a, b) => a.dias - b.dias);

                    mensaje += `🏢 ${nombreEmpresa}\n\n`;
                    for (const p of pedidosEmpresa) {
                        mensaje += `   👤 Cliente: ${p.Cliente}\n`;
                        mensaje += `   📅 Entrega: ${p.Entrega}\n`;
                        mensaje += `   ${p.Color} ${p.Etiqueta}\n`;
                        mensaje += `   📦 Pedido #${p.Codigo}\n\n`;
                    }
                    mensaje += `─────────────────\n\n`;
                }
                mensaje += `\n✅ Gracias por confiar en PROSYSTEM`;
                await EnviarTextoLibre(mensaje, numero);
            }
            // console.log(`✅ [${fechaHoy}] — ${alertas.length} pedidos procesados`);
        } else {
            console.log(`✅ [${fechaHoy}] — Sin pedidos próximos a vencer`);
        }
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
};

const Iniciar = () => {
    const faltan = [];
    if (!TOKEN) faltan.push('WHATSAPP_TOKEN');
    if (!ID_TELEFONO && !MODO_PRUEBA) faltan.push('WHATSAPP_ID_TELEFONO');
    if (!LISTA_NUMEROS_DESTINO.length) faltan.push('WHATSAPP_NUMERO_DESTINO');

    if (faltan.length && !MODO_PRUEBA) {
        return console.warn('⚠️ Faltan variables:', faltan.join(', '));
    }

    console.log('\n' + '='.repeat(50));
    if (MODO_PRUEBA) {
        console.log('🧪 MODO PRUEBA — Solo se muestra en pantalla');
    } else {
        console.log('✅ MODO PRODUCCIÓN — Fechas corregidas');
        console.log('⚠️ Requiere conversación abierta con el cliente');
    }
    console.log('='.repeat(50) + '\n');

    cron.schedule(HORA_ENVIO, Revisar, { timezone: ZONA_GUATEMALA });
    console.log(`⏰ Revisión programada: ${HORA_ENVIO}\n`);
};

module.exports = { IniciarAlertasWhatsApp: Iniciar, RevisarPedidosPorVencer: Revisar };
