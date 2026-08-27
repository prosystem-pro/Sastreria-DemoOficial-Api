const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { Op } = require('sequelize');

const {
    PedidoModelo,
    PagoModelo,
    PagoAplicacionModelo,
    PedidoDetalleModelo,
    InventarioModelo
} = require('../Relaciones/Relaciones');

const {
    RangoGuatemalaAUTC
} = require('../Utilidades/ConversionFechas');

const { LanzarError } = require('../Utilidades/ErrorServicios');

const ReportePedidos = async (
    FechaInicio,
    FechaFin,
    CodigoEmpresa
) => {

    try {

        if (
            !FechaInicio ||
            !FechaFin ||
            FechaInicio === 'undefined' ||
            FechaFin === 'undefined'
        ) {

            return {
                TotalPedidos: 0,
                MontoPedidos: 0,
                TotalAbono: 0,
                SaldoPendiente: 0,
                CostoPedidos: 0,      
                GananciaPedidos: 0  
            };
        }

        let filtroPedido = {
            Estatus: 1,
            TipoDocumento: 'PEDIDO',
            CodigoEmpresa: CodigoEmpresa
        };

        const {
            inicioUTC,
            finUTC
        } = RangoGuatemalaAUTC(
            FechaInicio,
            FechaFin
        );

        filtroPedido.FechaCreacion = {
            [Op.between]: [
                inicioUTC,
                finUTC
            ]
        };

        const pedidos = await PedidoModelo.findAll({

            attributes: [
                [
                    Sequelize.fn(
                        'COUNT',
                        Sequelize.col('CodigoPedido')
                    ),
                    'TotalPedidos'
                ],
                [
                    Sequelize.fn(
                        'SUM',
                        Sequelize.col('Total')
                    ),
                    'MontoPedidos'
                ]
            ],

            where: filtroPedido,
            raw: true
        });

        const abonos = await PagoAplicacionModelo.findAll({

            attributes: [
                [
                    Sequelize.fn(
                        'SUM',
                        Sequelize.col('MontoAplicado')
                    ),
                    'TotalAbono'
                ]
            ],

            where: {
                TipoDocumento: 'PEDIDO'
            },

            include: [
                {
                    model: PagoModelo,
                    as: 'FnPago',
                    attributes: [],
                    where: {
                        Estatus: 1
                    },
                    required: true
                },
                {
                    model: PedidoModelo,
                    as: 'Pedido',
                    attributes: [],
                    where: filtroPedido,
                    required: true
                }
            ],

            raw: true
        });

        const listaPedidos = await PedidoModelo.findAll({
            attributes: ['CodigoPedido'],
            where: filtroPedido,
            raw: true
        });

        let CostoPedidos = 0;

        if (listaPedidos.length > 0) {
            const codigosPedidos = listaPedidos.map(p => p.CodigoPedido);

            const detalles = await PedidoDetalleModelo.findAll({
                attributes: ['Cantidad', 'CodigoInventario'],
                where: { CodigoPedido: { [Op.in]: codigosPedidos } },
                raw: true
            });

            for (const item of detalles) {
                const inventario = await InventarioModelo.findOne({
                    attributes: ['PrecioCosto'],
                    where: { CodigoInventario: item.CodigoInventario },
                    raw: true
                });

                const precioCosto = Number(inventario?.PrecioCosto || 0);
                const cantidad = Number(item.Cantidad || 0);
                CostoPedidos += precioCosto * cantidad;
            }
        }

        const dataPedidos = pedidos[0] || {};
        const dataAbonos = abonos[0] || {};

        const TotalPedidos = Number(
            dataPedidos.TotalPedidos || 0
        );

        const MontoPedidos = Number(
            dataPedidos.MontoPedidos || 0
        );

        const TotalAbono = Number(
            dataAbonos.TotalAbono || 0
        );

        const SaldoPendiente =
            MontoPedidos - TotalAbono;

        const GananciaPedidos = MontoPedidos - CostoPedidos;

        return {

            TotalPedidos,
            MontoPedidos,
            TotalAbono,
            SaldoPendiente,
            CostoPedidos,    
            GananciaPedidos   

        };

    } catch (error) {

        throw error;
    }
};
const ReportePedidosAnexo = async (FechaInicio, FechaFin, CodigoEmpresa) => {

    try {

        let filtroPedido = {
            Estatus: 1,
            TipoDocumento: 'PEDIDO',
            CodigoEmpresa: { [Op.ne]: CodigoEmpresa }
        };

        if (FechaInicio && FechaFin && FechaInicio !== 'undefined' && FechaFin !== 'undefined') {
            const { inicioUTC, finUTC } = RangoGuatemalaAUTC(FechaInicio, FechaFin);
            filtroPedido.FechaCreacion = { [Op.between]: [inicioUTC, finUTC] };
        }

        // ================= TOTAL PEDIDOS =================
        const pedidos = await PedidoModelo.findAll({

            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('CodigoPedido')), 'TotalPedidos'],
                [Sequelize.fn('SUM', Sequelize.col('Total')), 'MontoPedidos']
            ],

            where: filtroPedido,
            raw: true
        });

        // ================= TOTAL ABONOS =================
        const abonos = await PagoAplicacionModelo.findAll({

            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('MontoAplicado')), 'TotalAbono']
            ],

            where: {
                TipoDocumento: 'PEDIDO'
            },

            include: [

                {
                    model: PagoModelo,
                    as: 'FnPago',
                    attributes: [],
                    where: { Estatus: 1 },
                    required: true
                },

                {
                    model: PedidoModelo,
                    as: 'Pedido',
                    attributes: [],
                    where: filtroPedido, // ✅ mismo filtro (ya excluye empresa)
                    required: true
                }

            ],

            raw: true
        });

        const dataPedidos = pedidos[0] || {};
        const dataAbonos = abonos[0] || {};

        const TotalPedidos = Number(dataPedidos.TotalPedidos || 0);
        const MontoPedidos = Number(dataPedidos.MontoPedidos || 0);
        const TotalAbono = Number(dataAbonos.TotalAbono || 0);

        const SaldoPendiente = MontoPedidos - TotalAbono;

        return {
            TotalPedidos,
            MontoPedidos,
            TotalAbono,
            SaldoPendiente
        };

    } catch (error) {

        throw error;
    }
};
const ReporteVentas = async (FechaInicio, FechaFin) => {

    try {

        // ✅ VALIDAR FECHAS
        if (
            !FechaInicio ||
            !FechaFin ||
            FechaInicio === 'undefined' ||
            FechaFin === 'undefined'
        ) {

            return {
                TotalVentas: 0,
                MontoVentas: 0,
                MontoCostoTotal: 0,  // ✅ NUEVO
                Ganancia: 0            // ✅ NUEVO
            };
        }

        let where = {
            Estatus: 1,
            TipoDocumento: 'VENTA'
        };

        const {
            inicioUTC,
            finUTC
        } = RangoGuatemalaAUTC(
            FechaInicio,
            FechaFin
        );

        where.FechaCreacion = {
            [Op.between]: [
                inicioUTC,
                finUTC
            ]
        };

        // ✅ TUS CÁLCULOS DE SIEMPRE (CONTAR Y SUMAR VENTAS)
        const ventas = await PedidoModelo.findAll({

            attributes: [
                [
                    Sequelize.fn(
                        'COUNT',
                        Sequelize.col('CodigoPedido')
                    ),
                    'TotalVentas'
                ],
                [
                    Sequelize.fn(
                        'SUM',
                        Sequelize.col('Total')
                    ),
                    'MontoVentas'
                ]
            ],

            where,
            raw: true
        });

        const data = ventas[0] || {};

        // ✅ OBTENER LISTA DE PEDIDOS PARA CALCULAR COSTO
        const pedidosLista = await PedidoModelo.findAll({
            attributes: ['CodigoPedido'],
            where,
            raw: true
        });

        let MontoCostoTotal = 0;

        if (pedidosLista.length > 0) {
            const codigosPedidos = pedidosLista.map(p => p.CodigoPedido);
            
            // ✅ OBTENER DETALLES DE TODAS LAS VENTAS
            const detalles = await PedidoDetalleModelo.findAll({
                attributes: ['Cantidad', 'CodigoInventario'],
                where: { CodigoPedido: { [Op.in]: codigosPedidos } },
                raw: true
            });

            // ✅ CALCULAR COSTO: PrecioCosto × Cantidad
            for (const item of detalles) {
                const inventario = await InventarioModelo.findOne({
                    attributes: ['PrecioCosto'],
                    where: { CodigoInventario: item.CodigoInventario },
                    raw: true
                });

                const precioCosto = Number(inventario?.PrecioCosto || 0);
                const cantidad = Number(item.Cantidad || 0);
                MontoCostoTotal += precioCosto * cantidad;
            }
        }

        // ✅ CALCULAR GANANCIA
        const MontoVentas = Number(data.MontoVentas || 0);
        const Ganancia = MontoVentas - MontoCostoTotal;

        // ✅ DEVOLVER TODO JUNTO
        return {

            TotalVentas: Number(
                data.TotalVentas || 0
            ),

            MontoVentas,
            MontoCostoTotal,  // ✅ NUEVO
            Ganancia            // ✅ NUEVO

        };

    } catch (error) {

        throw error;
    }
};
const ReporteCostosVentas = async (FechaInicio, FechaFin) => {
    try {
        if (!FechaInicio || !FechaFin || FechaInicio === 'undefined' || FechaFin === 'undefined') {
            return {
                CantidadVentas: 0,
                MontoCostoTotal: 0
            };
        }

        const { inicioUTC, finUTC } = RangoGuatemalaAUTC(FechaInicio, FechaFin);

        const pedidos = await PedidoModelo.findAll({
            attributes: ['CodigoPedido'],
            where: {
                Estatus: 1,
                TipoDocumento: 'VENTA',
                FechaCreacion: { [Op.between]: [inicioUTC, finUTC] }
            },
            raw: true
        });

        const CantidadVentas = pedidos.length;
        if (CantidadVentas === 0) {
            return { CantidadVentas: 0, MontoCostoTotal: 0 };
        }

        const codigosPedidos = pedidos.map(p => p.CodigoPedido);
        const detalles = await PedidoDetalleModelo.findAll({
            attributes: ['Cantidad', 'CodigoInventario'],
            where: { CodigoPedido: { [Op.in]: codigosPedidos } },
            raw: true
        });

        let MontoCostoTotal = 0;

        for (const item of detalles) {
            const inventario = await InventarioModelo.findOne({
                attributes: ['PrecioCosto'],
                where: { CodigoInventario: item.CodigoInventario },
                raw: true
            });

            const precioCosto = Number(inventario?.PrecioCosto || 0);
            const cantidad = Number(item.Cantidad || 0);

            // Sumar: PrecioCosto × Cantidad
            MontoCostoTotal += precioCosto * cantidad;
        }

        return {
            CantidadVentas,
            MontoCostoTotal: MontoCostoTotal
        };

    } catch (error) {
        throw error;
    }
};
const ReporteGanancia = async (FechaInicio, FechaFin) => {
    try {
        if (!FechaInicio || !FechaFin || FechaInicio === 'undefined' || FechaFin === 'undefined') {
            return {
                TotalVentaPedido: 0,
                Distribucion: {
                    Contado: { Cantidad: 0, Monto: 0 },
                    Pedido: { Cantidad: 0, Monto: 0, Abonado: 0, Pendiente: 0 }
                },
                TotalVendidoVentaPedido: 0,
                Desglose: { Contado: 0, Pedido: 0 },
                Costos: { TotalCosto: 0, Ganancia: 0 }
            };
        }

        const { inicioUTC, finUTC } = RangoGuatemalaAUTC(FechaInicio, FechaFin);
        const filtroFechas = { Estatus: 1, FechaCreacion: { [Op.between]: [inicioUTC, finUTC] } };

        // ==================================================
        // VENTAS AL CONTADO
        // ==================================================
        const ventasContado = await PedidoModelo.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('CodigoPedido')), 'Cantidad'],
                [Sequelize.fn('SUM', Sequelize.col('Total')), 'Monto']
            ],
            where: { ...filtroFechas, TipoDocumento: 'VENTA' },
            raw: true
        });

        // ==================================================
        // PEDIDOS / CRÉDITO — OBTENER CÓDIGOS + TOTALES
        // ==================================================
        const listaPedidos = await PedidoModelo.findAll({
            attributes: ['CodigoPedido'],
            where: { ...filtroFechas, TipoDocumento: 'PEDIDO' },
            raw: true
        });
        const codigosPedidos = listaPedidos.map(p => p.CodigoPedido);

        const totalesPedidos = await PedidoModelo.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('CodigoPedido')), 'Cantidad'],
                [Sequelize.fn('SUM', Sequelize.col('Total')), 'Monto']
            ],
            where: { ...filtroFechas, TipoDocumento: 'PEDIDO' },
            raw: true
        });

        // ==================================================
        // ✅ SUMAR ABONOS DESDE PagoAplicacion
        //    Campo correcto: MontoAplicado
        // ==================================================
        let TotalAbonado = 0;
        if (codigosPedidos.length > 0) {
            const sumaAbonos = await PagoAplicacionModelo.findAll({
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.col('MontoAplicado')), 'TotalAbonado'] // ✅ CORRECTO
                ],
                where: { CodigoDocumento: { [Op.in]: codigosPedidos } },
                raw: true
            });
            TotalAbonado = Number(sumaAbonos[0]?.TotalAbonado || 0);
        }

        // ==================================================
        // COSTO DE PRODUCTOS
        // ==================================================
        const todosPedidos = await PedidoModelo.findAll({
            attributes: ['CodigoPedido'],
            where: { ...filtroFechas },
            raw: true
        });
        const listaCodigos = todosPedidos.map(p => p.CodigoPedido);

        const detalles = await PedidoDetalleModelo.findAll({
            attributes: ['Cantidad', 'CodigoInventario'],
            where: { CodigoPedido: { [Op.in]: listaCodigos } },
            raw: true
        });

        let TotalCosto = 0;
        for (const item of detalles) {
            const inventario = await InventarioModelo.findOne({
                attributes: ['PrecioCosto'],
                where: { CodigoInventario: item.CodigoInventario },
                raw: true
            });
            TotalCosto += Number(inventario?.PrecioCosto || 0) * Number(item.Cantidad || 0);
        }

        // ==================================================
        // ASIGNAR VALORES FINALES
        // ==================================================
        const CantidadContado = Number(ventasContado[0]?.Cantidad || 0);
        const MontoContado = Number(ventasContado[0]?.Monto || 0);

        const CantidadPedido = Number(totalesPedidos[0]?.Cantidad || 0);
        const MontoPedido = Number(totalesPedidos[0]?.Monto || 0);
        const Pendiente = MontoPedido - TotalAbonado;

        const TotalVentaPedido = CantidadContado + CantidadPedido;
        const TotalVendidoVentaPedido = MontoContado + MontoPedido;
        const Ganancia = TotalVendidoVentaPedido - TotalCosto;

        // ==================================================
        return {
            TotalVentaPedido,
            Distribucion: {
                Contado: { Cantidad: CantidadContado, Monto: MontoContado },
                Pedido: { Cantidad: CantidadPedido, Monto: MontoPedido, Abonado: TotalAbonado, Pendiente }
            },
            TotalVendidoVentaPedido,
            Desglose: { Contado: MontoContado, Pedido: MontoPedido },
            Costos: { TotalCosto, Ganancia }
        };

    } catch (error) {
        throw error;
    }
};






module.exports = {
    ReporteVentas, ReportePedidos, ReportePedidosAnexo,
    ReporteCostosVentas, ReporteGanancia
};