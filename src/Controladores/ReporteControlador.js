
const Servicio = require('../Servicios/ReporteServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const ReporteVentas = async (req, res) => {
    try {

        const { FechaInicio, FechaFin } = req.query;

        const Objeto = await Servicio.ReporteVentas(
            FechaInicio,
            FechaFin
        );

        return ResponderExito(
            res,
            'Reporte de ventas generado correctamente.',
            Objeto || {}
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al generar el reporte de ventas'
        );

    }
};

const ReportePedidos = async (req, res) => {
    try {

        const { FechaInicio, FechaFin } = req.query;

        const CodigoEmpresa = req.Datos.CodigoEmpresa;

        const Objeto = await Servicio.ReportePedidos(
            FechaInicio,
            FechaFin,
            CodigoEmpresa 
        );

        return ResponderExito(
            res,
            'Reporte de pedidos generado correctamente.',
            Objeto || {}
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al generar el reporte de pedidos'
        );

    }
};

const ReportePedidosAnexo = async (req, res) => {
    try {

        const { FechaInicio, FechaFin } = req.query;

        const CodigoEmpresa = req.Datos.CodigoEmpresa;

        const Objeto = await Servicio.ReportePedidosAnexo(
            FechaInicio,
            FechaFin,
            CodigoEmpresa
        );

        return ResponderExito(
            res,
            'Reporte de pedidos anexo generado correctamente.',
            Objeto || {}
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al generar el reporte de pedidos anexo'
        );

    }
};
module.exports = {

    ReporteVentas, ReportePedidos, ReportePedidosAnexo

};