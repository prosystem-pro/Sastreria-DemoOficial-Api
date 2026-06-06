const Express = require('express');
const Router = Express.Router();

const Modelo = 'reporte';
const Tabla = 'Reporte';

const { ReporteVentas, ReportePedidos,  ReportePedidosAnexo } = require('../Controladores/ReporteControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');


Router.get(`/${Modelo}/ventas`, VerificarToken, VerificarPermisos('ReporteVentas', Tabla), ReporteVentas);
Router.get(`/${Modelo}/pedidos`, VerificarToken, VerificarPermisos('ReportePedidos', Tabla), ReportePedidos);
Router.get(`/${Modelo}/pedidos-anexo`, VerificarToken, VerificarPermisos('ReportePedidosAnexo', Tabla), ReportePedidosAnexo);

module.exports = Router;