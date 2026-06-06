// Controladores/HistorialPedidoControlador.js

const Servicio = require('../Servicios/AnexoEmpresaOficialServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const ListadoPedidoPedidoEmpresaOficial = async (req, res) => {
    try {

        const { CodigoUsuario, CodigoRol } = req.Datos;

        const Objeto = await Servicio.ListadoPedidoPedidoEmpresaOficial({
            CodigoUsuario,
            CodigoRol
        });

        return ResponderExito(
            res,
            'Listado de pedidos obtenido correctamente.',
            Objeto || []
        );

    } catch (error) {
        return ManejarError(error, res, 'Error al obtener los pedidos');
    }
};

module.exports = {
    ListadoPedidoPedidoEmpresaOficial
};