
const Servicio = require('../Servicios/VentaServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

// =============================
// OBTENER DATOS IMPRESION VENTA
// =============================
const ObtenerDatosImpresion = async (req, res) => {
    try {
        const { CodigoPedido } = req.params;

        const datos = await Servicio.ObtenerDatosImpresion(CodigoPedido);
        return ResponderExito(
            res,
            'Datos de impresión obtenidos correctamente.',
            datos || {}
        );

    } catch (error) {
        return ManejarError(
            error,
            res,
            'Error al obtener datos de impresión de la venta'
        );
    }
};

// =============================
// GENERAR PDF VENTA
// =============================
const GenerarPDFVenta = async (req, res) => {

    try {

        const { CodigoPedido } = req.params;

        await Servicio.GenerarPDFVenta(
            CodigoPedido,
            res
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al generar PDF de la venta'
        );
    }
};

// =============================
// CREAR VENTA
// =============================
const CrearVenta = async (req, res) => {

    try {

        const datos = req.body;

        const DatosUsuario = req.Datos;   // 🔴 obtener usuario desde token

        const resultado = await Servicio.CrearVenta(
            datos,
            DatosUsuario
        );

        return ResponderExito(
            res,
            'Venta creada correctamente',
            resultado
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear venta'
        );

    }

};

//LISTADOS
const ListadoProducto = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoProducto();

        return ResponderExito(
            res,
            'Productos obtenidos correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener productos'
        );

    }

};
// =============================
// LISTADO DE VENTAS
// =============================
const ListadoVentas = async (req, res) => {
    try {
        const {
            FechaInicio,
            FechaFin
        } = req.query;

        const ventas = await Servicio.ListadoVentas(
            FechaInicio,
            FechaFin
        );

        return ResponderExito(
            res,
            'Listado de ventas obtenido correctamente.',
            ventas || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener listado de ventas'
        );

    }
};

// =============================
// ELIMINAR VENTA
// =============================
const EliminarVenta = async (req, res) => {

    try {

        const { CodigoPedido } = req.params;

        const DatosUsuario = req.Datos;

        const resultado = await Servicio.EliminarVenta(
            CodigoPedido,
            DatosUsuario
        );

        return ResponderExito(
            res,
            'Venta eliminada correctamente',
            resultado
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al eliminar venta'
        );

    }

};

module.exports = {
    ListadoProducto, CrearVenta, ListadoVentas, EliminarVenta, GenerarPDFVenta, ObtenerDatosImpresion
};