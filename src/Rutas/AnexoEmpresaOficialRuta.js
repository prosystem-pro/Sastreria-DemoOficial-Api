const Express = require('express');
const Router = Express.Router();
const Modelo = 'anexoempresaoficial';
const Tabla = 'AnexoEmpresaOficial';

const { ListadoPedidoPedidoEmpresaOficial } = require('../Controladores/AnexoEmpresaOficialControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado', Tabla), ListadoPedidoPedidoEmpresaOficial);

module.exports = Router;