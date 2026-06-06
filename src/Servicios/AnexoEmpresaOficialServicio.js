const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const { PedidoModelo, ClienteModelo, EstadoPedidoModelo, UsuarioModelo,
    ProductoModelo, PedidoDetalleModelo, InventarioModelo, PedidoDetalleMedidaModelo,
    TipoProductoModelo, TipoMedidaModelo, PagoModelo, PagoAplicacionModelo, TipoTelaModelo,
    TelaModelo, MovimientoInventarioModelo, EmpresaModelo } = require('../Relaciones/Relaciones');

// const EmpresaModelo = require('../Modelos/Empresa')(BaseDatos, Sequelize.DataTypes);
const TipoProducto = require('../Modelos/TipoProducto')(BaseDatos, Sequelize.DataTypes);
const TipoTela = require('../Modelos/TipoTela')(BaseDatos, Sequelize.DataTypes);
const Tela = require('../Modelos/Tela')(BaseDatos, Sequelize.DataTypes);
const Producto = require('../Modelos/Producto')(BaseDatos, Sequelize.DataTypes);
const Cliente = require('../Modelos/Cliente')(BaseDatos, Sequelize.DataTypes);
const TipoCuello = require('../Modelos/TipoCuello')(BaseDatos, Sequelize.DataTypes);
const EstadoPedido = require('../Modelos/EstadoPedido')(BaseDatos, Sequelize.DataTypes);
const PedidoDetalle = require('../Modelos/PedidoDetalle')(BaseDatos, Sequelize.DataTypes);
const PedidoDetalleMedida = require('../Modelos/PedidoDetalleMedida')(BaseDatos, Sequelize.DataTypes);
const TipoMedida = require('../Modelos/TipoMedida')(BaseDatos, Sequelize.DataTypes);
const FormaPago = require('../Modelos/FormaPago')(BaseDatos, Sequelize.DataTypes);
const { GenerarDocumento } = require('../Utilidades/GeneradorDocumento');
const { LanzarError } = require('../Utilidades/ErrorServicios');
const { Op } = require('sequelize');


const ListadoPedidoPedidoEmpresaOficial = async ({ CodigoUsuario, CodigoRol }) => {
    try {

        // 🔎 1. Obtener usuario con empresa y rol (ALIAS CORRECTO: 'Rol')
        const usuario = await UsuarioModelo.findOne({
            where: { CodigoUsuario },
            attributes: ['CodigoEmpresa', 'CodigoRol'],
            include: [
                {
                    association: 'Rol', // ✅ CORRECTO según tus relaciones
                    attributes: ['NombreRol']
                }
            ]
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const CodigoEmpresaUsuario = usuario.CodigoEmpresa;
        const NombreRol = usuario.Rol?.NombreRol;

        // 🔎 2. Filtro por empresa
        let filtroEmpresa = {};

        if (NombreRol === 'EMPRESA_OFICIAL') {
            filtroEmpresa = {
                CodigoEmpresa: {
                    [Op.ne]: CodigoEmpresaUsuario // ❌ excluye la suya
                }
            };
        }

        if (NombreRol === 'EMPRESA_ASOCIADA') {
            filtroEmpresa = {
                CodigoEmpresa: CodigoEmpresaUsuario // ✅ solo la suya
            };
        }

        // 🔎 3. Query principal (AHORA SÍ con Empresa correctamente)
        const pedidos = await PedidoModelo.findAll({
            where: {
                Estatus: { [Op.in]: [1, 2, 3, 4] },
                ...filtroEmpresa
            },
            attributes: [
                'CodigoPedido',
                'FechaCreacion',
                'FechaEntrega',
                'Subtotal',
                'Descuento',
                'Total',
                'CodigoEmpresa'
            ],
            include: [
                {
                    association: 'AdEmpresa', // ⚠️ asegúrate que ya agregaste esta relación
                    attributes: ['CodigoEmpresa', 'NombreEmpresa']
                },
                {
                    association: 'CaCliente',
                    attributes: ['NombreCliente']
                },
                {
                    association: 'CaEstadoPedido',
                    attributes: ['CodigoEstadoPedido', 'NombreEstadoPedido'],
                    where: {
                        NombreEstadoPedido: {
                            [Op.notIn]: ['ENTREGADO', 'VENDIDO']
                        }
                    }
                },
                {
                    association: 'AdUsuario',
                    attributes: ['NombreUsuario']
                }
            ],
            order: [['FechaCreacion', 'DESC']]
        });

        // 🔎 4. Mapear resultados + cálculos
        const resultado = [];

        for (const p of pedidos) {

            const Total = Number(p.Total || 0);

            const pagos = await PagoAplicacionModelo.findAll({
                where: {
                    TipoDocumento: 'PEDIDO',
                    CodigoDocumento: p.CodigoPedido
                },
                attributes: ['MontoAplicado']
            });

            const TotalPagado = pagos.reduce(
                (sum, pago) => sum + Number(pago.MontoAplicado),
                0
            );

            const SaldoPendiente = Total - TotalPagado;

            resultado.push({
                CodigoPedido: p.CodigoPedido,

                // 👇 EMPRESA
                CodigoEmpresa: p.AdEmpresa?.CodigoEmpresa || 0,
                NombreEmpresa: p.AdEmpresa?.NombreEmpresa || 'Sin empresa',

                NombreCliente: p.CaCliente?.NombreCliente || 'Sin cliente',
                FechaCreacion: p.FechaCreacion,
                FechaEntrega: p.FechaEntrega,
                Subtotal: p.Subtotal,
                Descuento: p.Descuento,
                Total: Total,
                NombreEstatus: p.CaEstadoPedido?.NombreEstadoPedido || 'Sin estado',
                Estatus: p.CaEstadoPedido?.CodigoEstadoPedido || 0,
                Usuario: p.AdUsuario?.NombreUsuario || 'Sin usuario',
                TotalPagado: TotalPagado,
                SaldoPendiente: SaldoPendiente < 0 ? 0 : SaldoPendiente
            });
        }

        return resultado;

    } catch (error) {
        console.error(' ERROR REAL EN SERVICIO:', error);
        throw error;
    }
};

const EliminarPedido = async (CodigoPedido) => {

    const transaccion = await BaseDatos.transaction();

    try {

        if (!CodigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

        const pedido = await PedidoModelo.findOne({
            where: { CodigoPedido },
            transaction: transaccion
        });

        if (!pedido)
            LanzarError('El pedido no existe', 404, 'Advertencia');

        const detalles = await PedidoDetalleModelo.findAll({
            where: { CodigoPedido },
            transaction: transaccion
        });

        for (const detalle of detalles) {

            const inventario = await InventarioModelo.findOne({
                where: {
                    CodigoInventario: detalle.CodigoInventario
                },
                transaction: transaccion,
                lock: true
            });

            if (inventario) {

                const stockAnterior = inventario.StockActual;
                const stockNuevo = stockAnterior + detalle.Cantidad;

                await inventario.update({
                    StockActual: stockNuevo
                }, { transaction: transaccion });

                // ================= MOVIMIENTO INVENTARIO =================
                await MovimientoInventarioModelo.create({

                    CodigoEmpresa: 1,
                    CodigoInventario: inventario.CodigoInventario,
                    CodigoUsuario: pedido.CodigoUsuario,

                    TipoMovimiento: 'ENTRADA',
                    OrigenMovimiento: 'ELIMINACION_PEDIDO',

                    TipoDocumento: 'PEDIDO',
                    CodigoDocumento: CodigoPedido,

                    Cantidad: detalle.Cantidad,

                    StockAnterior: stockAnterior,
                    StockNuevo: stockNuevo,

                    FechaMovimiento: new Date(),
                    Observacion: `Entrada por eliminación pedido ${CodigoPedido}`,

                    Estatus: 1,
                    FechaCreacion: new Date()

                }, { transaction: transaccion });
            }

            await PedidoDetalleMedidaModelo.destroy({
                where: {
                    CodigoPedidoDetalle: detalle.CodigoPedidoDetalle
                },
                transaction: transaccion
            });

            await detalle.destroy({
                transaction: transaccion
            });
        }

        // ================= PAGOS =================
        const pagosAplicados = await PagoAplicacionModelo.findAll({
            where: {
                TipoDocumento: 'PEDIDO',
                CodigoDocumento: CodigoPedido
            },
            transaction: transaccion
        });

        for (const pagoAplicacion of pagosAplicados) {

            await pagoAplicacion.destroy({
                transaction: transaccion
            });

            await PagoModelo.destroy({
                where: {
                    CodigoPago: pagoAplicacion.CodigoPago
                },
                transaction: transaccion
            });
        }

        await pedido.destroy({
            transaction: transaccion
        });

        await transaccion.commit();

        return {
            CodigoPedido,
            TotalDetalles: detalles.length,
            TotalPagos: pagosAplicados.length,
            Mensaje: 'Pedido eliminado completamente'
        };

    } catch (error) {

        try {
            await transaccion.rollback();
        } catch (_) { }

        console.error(error);
        throw error;
    }
};

module.exports = {
    ListadoPedidoPedidoEmpresaOficial
};