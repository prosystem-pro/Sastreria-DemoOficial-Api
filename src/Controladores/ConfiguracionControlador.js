const Servicio = require('../Servicios/ConfiguracionServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const ObtenerInventarioListado = async (req, res) => {
    try {

        const { CodigoEmpresa } = req.params;

        const inventario = await Servicio.ObtenerInventarioListado(
            CodigoEmpresa
        );

        return ResponderExito(
            res,
            'Inventario obtenido correctamente',
            inventario,
            200
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener el inventario'
        );

    }
};
const CrearProductoInventario = async (req, res) => {
    try {

        const datos = req.body;

        const CodigoUsuario = req.Datos.CodigoUsuario;

        const creado = await Servicio.CrearProductoInventario(
            datos,
            CodigoUsuario
        );

        return ResponderExito(
            res,
            'Producto e inventario creados correctamente.',
            creado || {},
            201
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear el producto e inventario'
        );

    }
};

// CONTROLADOR: CrearVariación en Inventario
const CrearVariacionInventario = async (req, res) => {
    try {
        const datos = req.body;
        const CodigoUsuario = req.Datos.CodigoUsuario;

        // Llamamos al servicio que solo crea la variación en inventario
        const inventarioCreado = await Servicio.CrearVariacionInventario(
            datos,
            CodigoUsuario
        );

        return ResponderExito(
            res,
            'Variación agregada al inventario correctamente.',
            inventarioCreado || {},
            201
        );

    } catch (error) {
        return ManejarError(
            error,
            res,
            'Error al agregar variación al inventario'
        );
    }
};

const ObtenerInventarioPorCodigo = async (req, res) => {
    try {
        const { CodigoInventario } = req.params; // O req.body si prefieres enviar por POST

        if (!CodigoInventario) {
            return ManejarError({ message: 'Código de inventario es requerido' }, res);
        }

        const inventario = await Servicio.ObtenerInventarioPorCodigo(CodigoInventario);

        return ResponderExito(
            res,
            'Inventario obtenido correctamente',
            inventario,
            200
        );

    } catch (error) {
        return ManejarError(error, res, 'Error al obtener inventario por código');
    }
};
const RestaurarInventario = async (req, res) => {
    try {
        let { CodigosInventario } = req.body;
        const CodigoUsuario = req.Datos.CodigoUsuario;

        const resultado = await Servicio.RestaurarInventario(CodigosInventario, CodigoUsuario);

        return ResponderExito(
            res,
            resultado.mensaje,
            { CodigosInventario: resultado.CodigosInventario },
            200
        );

    } catch (error) {
        return ManejarError(error, res, 'Error al restaurar el inventario');
    }
};

const EliminarInventario = async (req, res) => {
    try {
        const { CodigoInventario } = req.params;
        const CodigoUsuario = req.Datos.CodigoUsuario;

        const resultado = await Servicio.EliminarInventario(CodigoInventario, CodigoUsuario);

        return ResponderExito(
            res,
            resultado.mensaje,
            { CodigoInventario: resultado.CodigoInventario },
            200
        );
    } catch (error) {
        return ManejarError(error, res, 'Error al eliminar el inventario');
    }
};

const ObtenerInventarioEliminados = async (req, res) => {
    try {
        const { CodigoEmpresa } = req.params;

        const inventario = await Servicio.ObtenerInventarioEliminados(CodigoEmpresa);

        return ResponderExito(
            res,
            'Inventario eliminado obtenido correctamente',
            inventario,
            200
        );

    } catch (error) {
        return ManejarError(error, res, 'Error al obtener inventario eliminado');
    }
};

const ActualizarProductoInventario = async (req, res) => {
    try {
        const { CodigoInventario } = req.params;
        const datos = req.body;
        const CodigoUsuario = req.Datos.CodigoUsuario;

        if (!CodigoInventario) {
            return ManejarError({ message: 'Código de inventario es requerido' }, res);
        }

        const actualizado = await Servicio.ActualizarProductoInventario(
            Number(CodigoInventario),
            datos,
            CodigoUsuario
        );

        return ResponderExito(
            res,
            'Producto e inventario actualizados correctamente.',
            actualizado || {},
            200
        );

    } catch (error) {
        return ManejarError(
            error,
            res,
            'Error al actualizar el producto e inventario'
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
const ListadoTipoTela = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoTipoTela();

        return ResponderExito(
            res,
            'Tipos de tela obtenidos correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener tipos de tela'
        );

    }

};

const ListadoTela = async (req, res) => {
    try {

        const { CodigoTipoTela } = req.params;

        if (!CodigoTipoTela)
            return ResponderError(
                res,
                'CodigoTipoTela es requerido',
                400
            );

        const Objeto = await Servicio.ListadoNombreTela(CodigoTipoTela);

        return ResponderExito(
            res,
            'Telas obtenidas correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener telas'
        );

    }
};
const ListadoTelaCompleto = async (req, res) => {
    try {

        const Objeto = await Servicio.ListadoNombreTelaCompleto();

        return ResponderExito(
            res,
            'Listado de telas obtenido correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener listado de telas'
        );

    }
};
// =============================
// CREAR
// =============================

const CrearTipoTela = async (req, res) => {

    try {

        const Objeto = await Servicio.CrearTipoTela(req.body);

        return ResponderExito(
            res,
            'Tipo de tela creado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear tipo de tela'
        );

    }

};

const CrearTela = async (req, res) => {

    try {

        const Objeto = await Servicio.CrearTela(req.body);

        return ResponderExito(
            res,
            'Tela creada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear tela'
        );

    }

};


// =============================
// OBTENER POR CODIGO
// =============================

const ObtenerTipoTelaPorCodigo = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.ObtenerTipoTelaPorCodigo(codigo);

        return ResponderExito(
            res,
            'Tipo de tela obtenido correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener tipo de tela'
        );

    }

};

const ObtenerTelaPorCodigo = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.ObtenerTelaPorCodigo(codigo);

        return ResponderExito(
            res,
            'Tela obtenida correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener tela'
        );

    }

};


// =============================
// EDITAR
// =============================

const EditarTipoTela = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.EditarTipoTela(
            codigo,
            req.body
        );

        return ResponderExito(
            res,
            'Tipo de tela editado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al editar tipo de tela'
        );

    }

};

const EditarTela = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.EditarTela(
            codigo,
            req.body
        );

        return ResponderExito(
            res,
            'Tela editada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al editar tela'
        );

    }

};
// =============================
// ELIMINAR
// =============================
const EliminarTipoTela = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.EliminarTipoTela(codigo);

        return ResponderExito(
            res,
            'Tipo de tela eliminado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al eliminar tipo de tela'
        );

    }

};

const EliminarTela = async (req, res) => {

    try {

        const { codigo } = req.params;

        const Objeto = await Servicio.EliminarTela(codigo);

        return ResponderExito(
            res,
            'Tela eliminada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al eliminar tela'
        );

    }

};

module.exports = {
    CrearProductoInventario, ObtenerInventarioListado, ObtenerInventarioPorCodigo, RestaurarInventario,
    EliminarInventario, ObtenerInventarioEliminados, ActualizarProductoInventario, ListadoTela, ListadoTipoTela,
    CrearTipoTela,
    CrearTela,
    ObtenerTipoTelaPorCodigo,
    ObtenerTelaPorCodigo,
    EditarTipoTela, ListadoTelaCompleto,
    EditarTela, EliminarTipoTela, EliminarTela, CrearVariacionInventario, ListadoProducto
};