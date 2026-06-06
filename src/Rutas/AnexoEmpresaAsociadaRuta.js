const Express = require('express');
const Router = Express.Router();
const Modelo = 'anexoempresaasociada';
const Tabla = 'AnexoEmpresaAsociada';

const { Listado, Crear, Editar, Eliminar, Obtener } = require('../Controladores/ClienteControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado_Cliente', Tabla), Listado);
Router.get(`/${Modelo}/obtener/:codigo`, VerificarToken, VerificarPermisos('Ver_Cliente', Tabla), Obtener);
Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear_Cliente', Tabla), Crear);
Router.put(`/${Modelo}/editar/:codigo`, VerificarToken, VerificarPermisos('Edita_Cliente', Tabla), Editar);
Router.delete(`/${Modelo}/eliminar/:codigo`, VerificarToken, VerificarPermisos('Eliminar_Cliente', Tabla), Eliminar);

module.exports = Router;