const cron = require('node-cron');
const axios = require('axios');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { PedidoModelo, ClienteModelo, EmpresaModelo, EstadoPedidoModelo } = require('../Relaciones/Relaciones');
const { FormatoFecha } = require('../Utilidades/ConversionFechas');

const ZONA_GUATEMALA = 'America/Guatemala';

// ==============================================
// 📋 CONFIGURACIÓN
// ==============================================

const TOKEN = process.env.WHATSAPP_TOKEN;
const ID_TELEFONO = process.env.WHATSAPP_ID_TELEFONO;

// ✅ Varios números separados por coma
const LISTA_NUMEROS_DESTINO = process.env.WHATSAPP_NUMERO_DESTINO
  ? process.env.WHATSAPP_NUMERO_DESTINO.split(',').map(num => num.trim())
  : [];

const VERSAO = process.env.WHATSAPP_VERSAO_API || 'v21.0';
const HORA_ENVIO = '0 */1 * * * *';
// const HORA_ENVIO = '0 0 7 * * *';

// ==============================================
// 📱 ENVIAR A UN NÚMERO
// ==============================================

const EnviarMensajeAUnNumero = async (mensaje, numeroDestino) => {
  try {
    const url = `https://graph.facebook.com/${VERSAO}/${ID_TELEFONO}/messages`;
    const respuesta = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: numeroDestino,
        text: { body: mensaje }
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ Mensaje enviado a ${numeroDestino} | ID: ${respuesta.data.messages[0].id}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando a ${numeroDestino}:`);
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return false;
  }
};

// ==============================================
// 🚀 ENVIAR A TODOS LOS NÚMEROS
// ==============================================

const EnviarMensajeWhatsApp = async (mensaje) => {
  console.log(`📤 Enviando a ${LISTA_NUMEROS_DESTINO.length} número(s)...`);
  for (const numero of LISTA_NUMEROS_DESTINO) {
    await EnviarMensajeAUnNumero(mensaje, numero);
  }
};

// ==============================================
// 🔍 CALCULAR DÍAS — SIN CAMBIOS
// ==============================================

const CalcularEstadoVencimiento = (fechaEntregaDB, hoyGuatemala) => {
  const fechaTexto = String(fechaEntregaDB).substring(0, 10);
  const [anio, mes, dia] = fechaTexto.split('-').map(Number);
  const entrega = DateTime.fromObject(
    { year: anio, month: mes, day: dia },
    { zone: ZONA_GUATEMALA }
  ).startOf('day');
  const hoy = hoyGuatemala.startOf('day');
  const diasDiferencia = Math.round((entrega - hoy) / (1000 * 60 * 60 * 24));
  let etiqueta;
  if (diasDiferencia > 0) {
    etiqueta = diasDiferencia === 1 ? 'Faltan 1 DÍA' : `Faltan ${diasDiferencia} DÍAS`;
  } else if (diasDiferencia === 0) {
    etiqueta = '✅ VENCE HOY';
  } else {
    const vencido = Math.abs(diasDiferencia);
    etiqueta = vencido === 1 ? `⚠️ VENCIDO hace 1 DÍA` : `⚠️ VENCIDO hace ${vencido} DÍAS`;
  }
  return { diasDiferencia, etiqueta };
};

// ==============================================
// 🔍 REVISAR PEDIDOS — ALIAS CORREGIDO: CaEstadoPedido
// ==============================================

const RevisarPedidosPorVencer = async () => {
  try {
    const hoyGuatemala = DateTime.now().setZone(ZONA_GUATEMALA);
    const fechaFormateada = hoyGuatemala.toFormat('dd/MM/yyyy');
    console.log('🔍 Revisando pedidos... HOY:', fechaFormateada);

    const pedidos = await PedidoModelo.findAll({
      where: {
        Estatus: { [Op.in]: [1, 2, 3, 4] },
        FechaEntrega: { [Op.ne]: null }
      },
      attributes: [
        'CodigoPedido',
        'FechaEntrega',
        'CodigoEmpresa',
        'CodigoEstadoPedido'
      ],
      include: [
        {
          model: ClienteModelo,
          as: 'CaCliente',
          attributes: ['NombreCliente']
        },
        {
          model: EmpresaModelo,
          as: 'AdEmpresa',
          attributes: ['NombreEmpresa']
        },
        // ✅ ALIAS CORREGIDO: CaEstadoPedido
        {
          model: EstadoPedidoModelo,
          as: 'CaEstadoPedido', // ← Este es el alias correcto según tu error
          attributes: ['NombreEstadoPedido']
        }
      ]
    });

    const alertas = [];
    for (const pedido of pedidos) {
      // ✅ IGNORAR si el estado es "Entregado"
      const nombreEstado = pedido.CaEstadoPedido?.NombreEstadoPedido || '';
      if (nombreEstado.trim().toUpperCase() === 'ENTREGADO') {
        continue; // ⏭️ Saltar pedidos ya entregados
      }

      const estado = CalcularEstadoVencimiento(pedido.FechaEntrega, hoyGuatemala);
      if (estado.diasDiferencia <= 5) {
        alertas.push({
          CodigoPedido: pedido.CodigoPedido,
          NombreCliente: pedido.CaCliente?.NombreCliente || 'Sin nombre',
          NombreEmpresa: pedido.AdEmpresa?.NombreEmpresa || 'Sastreria Demo Oficial',
          FechaEntrega: FormatoFecha(pedido.FechaEntrega),
          Etiqueta: estado.etiqueta
        });
      }
    }

    if (alertas.length > 0) {
      const agrupado = {};
      for (const alerta of alertas) {
        if (!agrupado[alerta.NombreEmpresa]) {
          agrupado[alerta.NombreEmpresa] = [];
        }
        agrupado[alerta.NombreEmpresa].push(alerta);
      }

      // ✅ ESPACIOS TAL CUAL
      let mensaje = `⚠️ ALERTA DE VENCIMIENTO — ${fechaFormateada}

`;
      mensaje += `📋 Se encontraron ${alertas.length} pedido(s):

`;

      for (const [nombreEmpresa, pedidosEmpresa] of Object.entries(agrupado)) {
        mensaje += `🏭 *${nombreEmpresa.toUpperCase()}*

`;
        for (const a of pedidosEmpresa) {
          mensaje += `   Cliente: ${a.NombreCliente}
`;
          mensaje += `   Entrega: ${a.FechaEntrega}
`;
          mensaje += `   ⏰ ${a.Etiqueta}
`;
          mensaje += `   📦 Pedido #${a.CodigoPedido}

`;
        }
      }

      console.log(`📤 Enviando resumen con ${alertas.length} alerta(s) de ${Object.keys(agrupado).length} empresa(s)...`);
      await EnviarMensajeWhatsApp(mensaje);
    } else {
      console.log('✅ Sin pedidos próximos a vencer o vencidos.');
    }
  } catch (error) {
    console.error('❌ Error en RevisarPedidosPorVencer:', error.message);
  }
};

// ==============================================
// 🚀 INICIAR TAREA
// ==============================================

const IniciarAlertasWhatsApp = () => {
  if (!TOKEN || !ID_TELEFONO || LISTA_NUMEROS_DESTINO.length === 0) {
    console.warn('⚠️ Variables de WhatsApp sin configurar → Tarea de alertas DESACTIVADA');
    return;
  }
  console.log(`📱 Alertas WhatsApp PROGRAMADAS → ${LISTA_NUMEROS_DESTINO.length} destinatario(s)`);
  cron.schedule(HORA_ENVIO, async () => {
    console.log('\n⏰ EJECUCIÓN PROGRAMADA: Revisión de vencimientos');
    await RevisarPedidosPorVencer();
  }, { timezone: "America/Guatemala" });
};

module.exports = {
  IniciarAlertasWhatsApp,
  RevisarPedidosPorVencer,
  EnviarMensajeWhatsApp
};
