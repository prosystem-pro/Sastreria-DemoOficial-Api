const { PedidoModelo, PagoModelo, PagoAplicacionModelo } = require('../Relaciones/Relaciones');

const CONFIG_DOCUMENTOS = {
    SERIE_EMPRESA: 'SCC001',

    TIPOS: {
        PEDIDO: { codigo: 'PED', nombre: 'PEDIDO' },
        PAGO: { codigo: 'PAG', nombre: 'PAGO' },
        VENTA: { codigo: 'VNT', nombre: 'VENTA' }
    },

    LONGITUD_NUMERO: 3
};

/**
 * Genera un documento con numeración secuencial.
 * Para PAGOS, la numeración se reinicia por cada pedido.
 * Para VENTAS y PEDIDOS, la numeración es global.
 */
const GenerarDocumento = async (tipoDocumento, CodigoEmpresa, transaction, CodigoPedido = null) => {

    const tipoConfig = CONFIG_DOCUMENTOS.TIPOS[tipoDocumento];
    if (!tipoConfig) throw new Error(`Tipo de documento no configurado: ${tipoDocumento}`);

    let numero = 1;

    if (tipoDocumento === 'PAGO') {
        // Para pagos, contar pagos existentes de ese pedido en PagoAplicacionModelo
        if (!CodigoPedido) throw new Error('Para generar un pago se requiere CodigoPedido');

        const totalPagos = await PagoAplicacionModelo.count({
            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: 'PEDIDO'
            },
            transaction
        });

        numero = totalPagos + 1; // reinicia numeración por pedido
    } else {
        // Para PEDIDO o VENTA, numeración global en PedidoModelo
        const ultimo = await PedidoModelo.findOne({
            where: {
                CodigoEmpresa,
                Serie: CONFIG_DOCUMENTOS.SERIE_EMPRESA,
                TipoDocumento: tipoConfig.nombre
            },
            order: [['Numero', 'DESC']],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (ultimo && ultimo.Numero) numero = ultimo.Numero + 1;
    }

    const numeroFormateado = numero.toString().padStart(CONFIG_DOCUMENTOS.LONGITUD_NUMERO, '0');
    const numeroDocumentoCompleto = `${CONFIG_DOCUMENTOS.SERIE_EMPRESA}-${tipoConfig.codigo}${numeroFormateado}`;

    return {
        Serie: CONFIG_DOCUMENTOS.SERIE_EMPRESA,
        TipoDocumento: tipoConfig.nombre,
        Numero: numero,
        NumeroDocumento: numeroDocumentoCompleto
    };
};

module.exports = { GenerarDocumento };