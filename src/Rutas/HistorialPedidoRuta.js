const Express = require('express');
const Router = Express.Router();
const Modelo = 'historialpedido';
const Tabla = 'HistorialPedido';

const { ObtenerDatosImpresion } = require('../Controladores/VentaControlador');
const { Listado, Obtener, ListadoTipoProducto, ListadoTipoTela, ListadoTela,
    ListadoProducto, ObtenerProducto, ListadoCliente, CrearPedido, ListadoTipoCuello,
    ObtenerPedido, ActualizarPedido, ListadoFormaPago, RegistrarPagoPedido, ListarPagosPorPedido,
    EliminarPedido, ListadoEstadoPedido, ListadoEntregados, GenerarPDFPedido, GenerarPDFPagoPedido, ObtenerDatosImpresionPagoPedido,
    ListadoVariacionesProducto } = require('../Controladores/HistorialPedidoControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado', Tabla), Listado);
Router.get(`/${Modelo}/obtener/:codigo`, VerificarToken, VerificarPermisos('Ver', Tabla), Obtener);

Router.get(`/${Modelo}/tipo-producto`, VerificarToken, VerificarPermisos('ListadoTipoProducto', Tabla), ListadoTipoProducto);
Router.get(`/${Modelo}/tipo-tela`, VerificarToken, VerificarPermisos('ListadoTipoTela', Tabla), ListadoTipoTela);
Router.get(`/${Modelo}/tela`, VerificarToken, VerificarPermisos('ListadoTela', Tabla), ListadoTela);
Router.get(`/${Modelo}/forma-pago`, VerificarToken, VerificarPermisos('ListadoFormaPago', Tabla), ListadoFormaPago);
Router.get(`/${Modelo}/tipo-cuello`, VerificarToken, VerificarPermisos('ListadoTipoCuello', Tabla), ListadoTipoCuello);

Router.get(`/${Modelo}/producto`, VerificarToken, VerificarPermisos('ListadoProducto', Tabla), ListadoProducto);
Router.get(`/${Modelo}/producto/:codigo`, VerificarToken, VerificarPermisos('VerProducto', Tabla), ObtenerProducto);

Router.get(`/${Modelo}/cliente`, VerificarToken, VerificarPermisos('ListadoCliente', Tabla), ListadoCliente);

Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('CrearPedido', Tabla), CrearPedido);

Router.get(`/${Modelo}/obtener-pedido/:CodigoPedido`, VerificarToken, VerificarPermisos('VerPedido', Tabla), ObtenerPedido);
Router.put(`/${Modelo}/actualizar`, VerificarToken, VerificarPermisos('EditarPedido', Tabla), ActualizarPedido);

Router.post(`/${Modelo}/pagar`, VerificarToken, VerificarPermisos('RegistrarPagoPedido', Tabla), RegistrarPagoPedido);
Router.get(`/${Modelo}/pagos/:CodigoPedido`, VerificarToken, VerificarPermisos('ListadoPagoPedido', Tabla), ListarPagosPorPedido);

Router.delete(`/${Modelo}/eliminar/:CodigoPedido`, VerificarToken, VerificarPermisos('EliminarPedido', Tabla), EliminarPedido);

Router.get(`/${Modelo}/estado-pedido`, VerificarToken, VerificarPermisos('ListadoEstadoPedido', Tabla), ListadoEstadoPedido);
Router.get(`/${Modelo}/entregados`, VerificarToken, VerificarPermisos('ListadoPedidoEntregado', Tabla), ListadoEntregados);

Router.get(`/${Modelo}/pdf/:CodigoPedido`, VerificarToken, VerificarPermisos('GenerarPDFPedido', Tabla), GenerarPDFPedido);
Router.get(`/${Modelo}/pdf-pago/:CodigoPedido`, VerificarToken, VerificarPermisos('GenerarPDFPagoPedido', Tabla), GenerarPDFPagoPedido);

Router.get(`/${Modelo}/imprimir/:CodigoPedido`, VerificarToken, VerificarPermisos('ImprimirVenta', Tabla), ObtenerDatosImpresion);

Router.get(`/${Modelo}/imprimir-pago/:CodigoPago`, VerificarToken, VerificarPermisos('ImprimirPagoPedido', Tabla), ObtenerDatosImpresionPagoPedido);
Router.get(`/${Modelo}/variaciones-producto`, VerificarToken, VerificarPermisos('ListadoVariacionesProductos', Tabla), ListadoVariacionesProducto);
module.exports = Router;