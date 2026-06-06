const Servicio = require('../Servicios/InventarioServicio');
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



const ListadoTipoProducto = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoTipoProducto();

        return ResponderExito(
            res,
            'Marcas obtenidas correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener marcas'
        );

    }

};

//LISTADOS
const ListadoMarca = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoMarca();

        return ResponderExito(
            res,
            'Marcas obtenidas correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener marcas'
        );

    }

};

const ListadoEstilo = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoEstilo();

        return ResponderExito(
            res,
            'Estilos obtenidos correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener estilos'
        );

    }

};


const ListadoTalla = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoTalla();

        return ResponderExito(
            res,
            'Tallas obtenidas correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener tallas'
        );

    }

};

const ListadoColor = async (req, res) => {

    try {

        const Objeto = await Servicio.ListadoColor();

        return ResponderExito(
            res,
            'Colores obtenidos correctamente.',
            Objeto || []
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener colores'
        );

    }

};

//CREAR
const CrearMarca = async (req, res) => {

    try {

        const { NombreMarca } = req.body;

        const Objeto = await Servicio.CrearMarca(NombreMarca);

        return ResponderExito(
            res,
            'Marca creada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear marca'
        );

    }

};

const CrearEstilo = async (req, res) => {

    try {

        const { NombreEstilo } = req.body;

        const Objeto = await Servicio.CrearEstilo(NombreEstilo);

        return ResponderExito(
            res,
            'Estilo creado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear estilo'
        );

    }

};

const CrearTalla = async (req, res) => {

    try {

        const { NombreTalla } = req.body;

        const Objeto = await Servicio.CrearTalla(NombreTalla);

        return ResponderExito(
            res,
            'Talla creada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear talla'
        );

    }

};

const CrearColor = async (req, res) => {

    try {

        const { NombreColor } = req.body;

        const Objeto = await Servicio.CrearColor(NombreColor);

        return ResponderExito(
            res,
            'Color creado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al crear color'
        );

    }

};
//OBTENER POR CODIGO
const ObtenerMarcaPorCodigo = async (req, res) => {

    try {

        const { CodigoMarca } = req.params;

        const Objeto = await Servicio.ObtenerMarcaPorCodigo(
            CodigoMarca
        );

        return ResponderExito(
            res,
            'Marca obtenida correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener marca'
        );

    }

};

const ObtenerEstiloPorCodigo = async (req, res) => {

    try {

        const { CodigoEstilo } = req.params;

        const Objeto = await Servicio.ObtenerEstiloPorCodigo(
            CodigoEstilo
        );

        return ResponderExito(
            res,
            'Estilo obtenido correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener estilo'
        );

    }

};

const ObtenerTallaPorCodigo = async (req, res) => {

    try {

        const { CodigoTalla } = req.params;

        const Objeto = await Servicio.ObtenerTallaPorCodigo(
            CodigoTalla
        );

        return ResponderExito(
            res,
            'Talla obtenida correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener talla'
        );

    }

};

const ObtenerColorPorCodigo = async (req, res) => {

    try {

        const { CodigoColor } = req.params;

        const Objeto = await Servicio.ObtenerColorPorCodigo(
            CodigoColor
        );

        return ResponderExito(
            res,
            'Color obtenido correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al obtener color'
        );

    }

};

// ACTUALIZAR
const ActualizarMarca = async (req, res) => {

    try {

        const { CodigoMarca, NombreMarca } = req.body;

        const Objeto = await Servicio.ActualizarMarca(
            CodigoMarca,
            NombreMarca
        );

        return ResponderExito(
            res,
            'Marca actualizada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al actualizar marca'
        );

    }

};

const ActualizarEstilo = async (req, res) => {

    try {

        const { CodigoEstilo, NombreEstilo } = req.body;

        const Objeto = await Servicio.ActualizarEstilo(
            CodigoEstilo,
            NombreEstilo
        );

        return ResponderExito(
            res,
            'Estilo actualizado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al actualizar estilo'
        );

    }

};

const ActualizarTalla = async (req, res) => {

    try {

        const { CodigoTalla, NombreTalla } = req.body;

        const Objeto = await Servicio.ActualizarTalla(
            CodigoTalla,
            NombreTalla
        );

        return ResponderExito(
            res,
            'Talla actualizada correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al actualizar talla'
        );

    }

};

const ActualizarColor = async (req, res) => {

    try {

        const { CodigoColor, NombreColor } = req.body;

        const Objeto = await Servicio.ActualizarColor(
            CodigoColor,
            NombreColor
        );

        return ResponderExito(
            res,
            'Color actualizado correctamente.',
            Objeto
        );

    } catch (error) {

        return ManejarError(
            error,
            res,
            'Error al actualizar color'
        );

    }

};

module.exports = {
    CrearProductoInventario, ListadoMarca, ListadoEstilo, ListadoTalla,
    ListadoColor, ListadoTipoProducto, ObtenerInventarioListado, EliminarInventario,
    ObtenerInventarioEliminados, RestaurarInventario, ObtenerInventarioPorCodigo, ActualizarProductoInventario,
    CrearMarca, CrearEstilo, CrearTalla, CrearColor, ActualizarMarca, ActualizarEstilo, ActualizarTalla, ActualizarColor,
    ObtenerMarcaPorCodigo, ObtenerEstiloPorCodigo, ObtenerTallaPorCodigo, ObtenerColorPorCodigo
};