// Controladores/HistorialPedidoControlador.js

const Servicio = require('../Servicios/HistorialPedidoServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const GenerarPDFPedido = async (req, res) => {
  try {
    const { CodigoPedido } = req.params;

    await Servicio.GenerarPDFPedido(Number(CodigoPedido), res);

    // No hace falta res.download ni retornar nada, el PDF ya se envía

  } catch (error) {
    return ManejarError(error, res, 'Error al generar el PDF del pedido');
  }
};
const GenerarPDFPagoPedido = async (req, res) => {
  try {

    const { CodigoPedido } = req.params;

    await Servicio.GenerarPDFPagoPedido(
      Number(CodigoPedido),
      res
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al generar el PDF de pago del pedido'
    );
  }
};
const ObtenerDatosImpresionPagoPedido = async (req, res) => {
  try {

    const { CodigoPago } = req.params;

    // ================= VALIDACIÓN =================
    if (!CodigoPago || isNaN(CodigoPago)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El código de pago es obligatorio y debe ser numérico'
      });
    }

    // ================= SERVICIO =================
    const data = await Servicio.ObtenerDatosImpresionPagoPedido(
      Number(CodigoPago)
    );

    return res.status(200).json({
      ok: true,
      data
    });

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener datos de impresión del pago del pedido'
    );
  }
};

const CrearPedido = async (req, res) => {
  try {

    const { CodigoUsuario, CodigoEmpresa, SuperAdmin, NombreRol } = req.Datos;

    if (SuperAdmin) {
      LanzarError('SuperAdmin no puede crear pedidos sin empresa', 403);
    }

    const Objeto = await Servicio.CrearPedido(
      req.body,
      CodigoUsuario,
      CodigoEmpresa,
      NombreRol
    );

    return ResponderExito(
      res,
      'Pedido creado correctamente.',
      Objeto || {}
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al crear el pedido'
    );

  }
};
const ObtenerPedido = async (req, res) => {
  try {

    const { CodigoPedido } = req.params;

    if (!CodigoPedido) {
      LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');
    }

    const Objeto = await Servicio.ObtenerPedido(CodigoPedido);
    return ResponderExito(
      res,
      'Pedido obtenido correctamente.',
      Objeto || {}
    );

  } catch (error) {
    // 🔥 Manejo de error siguiendo el estándar
    return ManejarError(
      error,
      res,
      'Error al obtener el pedido'
    );
  }
};

const ActualizarPedido = async (req, res) => {
  try {

    const datos = req.body;

    const CodigoUsuario = req.Datos.CodigoUsuario;
    const NombreRol = req.Datos.NombreRol;

    if (!datos.CodigoPedido) {
      LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');
    }

    const Objeto = await Servicio.ActualizarPedido(datos, CodigoUsuario, NombreRol);

    return ResponderExito(
      res,
      'Pedido actualizado correctamente.',
      Objeto || {}
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al actualizar el pedido'
    );

  }
};
const EliminarPedido = async (req, res) => {
  try {

    const { CodigoPedido } = req.params;

    if (!CodigoPedido) {
      LanzarError(
        'El código de pedido es obligatorio',
        400,
        'Advertencia'
      );
    }

    const Objeto = await Servicio.EliminarPedido(
      Number(CodigoPedido)
    );

    return ResponderExito(
      res,
      'Pedido eliminado correctamente.',
      Objeto || {}
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al eliminar el pedido'
    );

  }
};

const ListarPagosPorPedido = async (req, res) => {
  try {

    const { CodigoPedido } = req.params;

    if (!CodigoPedido) {
      LanzarError(
        'El código de pedido es obligatorio',
        400,
        'Advertencia'
      );
    }

    const pagos = await Servicio.ListarPagosPorPedido(
      Number(CodigoPedido)
    );

    return ResponderExito(
      res,
      'Pagos del pedido obtenidos correctamente.',
      pagos || []
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener pagos del pedido'
    );

  }
};

const RegistrarPagoPedido = async (req, res) => {
  try {

    const datos = req.body;
    const CodigoUsuario = req.Datos.CodigoUsuario;

    const Objeto = await Servicio.RegistrarPagoPedido(
      datos,
      CodigoUsuario
    );

    return ResponderExito(
      res,
      'Pago registrado correctamente.',
      Objeto || {}
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al registrar el pago del pedido'
    );

  }
};

const Listado = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin, NombreEmpresa } = req.Datos;

    const verOtros = req.query.verOtros === 'true';

    const {
      FechaInicio,
      FechaFin
    } = req.query;

    const Objeto = await Servicio.Listado(
      CodigoEmpresa,
      SuperAdmin,
      NombreEmpresa,
      verOtros,
      FechaInicio,
      FechaFin
    );

    return ResponderExito(
      res,
      'Listado de pedidos obtenido correctamente.',
      Objeto || []
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener los pedidos');
  }
};

const ListadoEntregados = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin, NombreEmpresa } = req.Datos;

    const verOtros = req.query.verOtros === 'true';

    const {
      FechaInicio,
      FechaFin
    } = req.query;

    const Objeto = await Servicio.ListadoEntregados(
      CodigoEmpresa,
      SuperAdmin,
      NombreEmpresa,
      verOtros,
      FechaInicio,
      FechaFin
    );

    return ResponderExito(
      res,
      'Listado de pedidos entregados obtenido correctamente.',
      Objeto || []
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener los pedidos entregados'
    );

  }
};

const Obtener = async (req, res) => {
  try {

    const { codigo } = req.params;

    const Objeto = await Servicio.Obtener(codigo);

    return ResponderExito(
      res,
      'Pedido obtenido correctamente.',
      Objeto || {}
    );

  } catch (error) {

    return ManejarError(error, res, 'Error al obtener el pedido');

  }
};

const ListadoTipoProducto = async (req, res) => {
  try {


    const { NombreRol } = req.Datos;

    const Objeto = await Servicio.ListadoTipoProducto(NombreRol);

    return ResponderExito(
      res,
      'Tipos de producto obtenidos correctamente.',
      Objeto || []
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener tipos de producto'
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

    const Objeto = await Servicio.ListadoTela();

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

const ListadoProducto = async (req, res) => {
  try {

    const { CodigoTipoProducto } = req.query;

    const productos = await Servicio.ListadoProducto(
      CodigoTipoProducto ? Number(CodigoTipoProducto) : null
    );

    return ResponderExito(
      res,
      'Productos obtenidos correctamente.',
      productos || []
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener productos');
  }
};

const ListadoVariacionesProducto = async (req, res) => {
  try {

    const { CodigoProducto } = req.query;

    if (!CodigoProducto) {
      return res.status(400).json({
        ok: false,
        mensaje: 'CodigoProducto es requerido'
      });
    }

    const variaciones = await Servicio.ListadoVariacionesProducto(
      Number(CodigoProducto)
    );

    return ResponderExito(
      res,
      'Variaciones obtenidas correctamente.',
      variaciones
    );

  } catch (error) {
    return ManejarError(error, res);
  }
};

const ListadoTipoCuello = async (req, res) => {
  try {

    const tiposCuello = await Servicio.ListadoTipoCuello();

    return ResponderExito(
      res,
      'Tipos de cuello obtenidos correctamente.',
      tiposCuello || []
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener tipos de cuello'
    );

  }
};

const ListadoEstadoPedido = async (req, res) => {
  try {

    const estadosPedido = await Servicio.ListadoEstadoPedido();

    return ResponderExito(
      res,
      'Estados de pedido obtenidos correctamente.',
      estadosPedido || []
    );

  } catch (error) {

    return ManejarError(
      error,
      res,
      'Error al obtener estados de pedido'
    );

  }
};

// const ObtenerProducto = async (req, res) => {
//   try {
//     const { codigo } = req.params;

//     // Llamamos al servicio que devuelve solo nombre y precio
//     const producto = await Servicio.ObtenerProducto(codigo);

//     return ResponderExito(
//       res,
//       'Producto obtenido correctamente.',
//       producto || {}
//     );

//   } catch (error) {
//     return ManejarError(
//       error,
//       res,
//       'Error al obtener el producto'
//     );
//   }
// };
const ObtenerProducto = async (req, res) => {
  try {

    const { codigo } = req.params;

    // 🔥 variaciones opcionales (solo para confección)
    const { codigoTela, codigoTipoTela } = req.query;

    const producto = await Servicio.ObtenerProducto(
      codigo,
      codigoTela || null,
      codigoTipoTela || null
    );

    return ResponderExito(
      res,
      'Producto obtenido correctamente.',
      producto
    );

  } catch (error) {
    return ManejarError(
      error,
      res,
      'Error al obtener el producto'
    );
  }
};

const ListadoCliente = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;

    const clientes = await Servicio.ListadoCliente(CodigoEmpresa, SuperAdmin);

    return ResponderExito(
      res,
      'Clientes obtenidos correctamente.',
      clientes || []
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener clientes');
  }
};

const ListadoFormaPago = async (req, res) => {
  try {
    const formasPago = await Servicio.ListadoFormaPago();

    return ResponderExito(
      res,
      'Formas de pago obtenidas correctamente.',
      formasPago || []
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener formas de pago');
  }
};



module.exports = {
  Listado, Obtener, ListadoTipoProducto, ListadoTipoTela, ListadoTela,
  ListadoProducto, ObtenerProducto, ListadoCliente, CrearPedido, ListadoTipoCuello, ObtenerPedido,
  ActualizarPedido, ListadoFormaPago, RegistrarPagoPedido, ListarPagosPorPedido, EliminarPedido,
  ListadoEstadoPedido, ListadoEntregados, GenerarPDFPedido, GenerarPDFPagoPedido, ObtenerDatosImpresionPagoPedido,
  ListadoVariacionesProducto
};