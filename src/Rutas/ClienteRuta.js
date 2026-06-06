const Express = require('express');
const Router = Express.Router();
const Modelo = 'cliente';
const Tabla = 'Cliente';

const { Listado, Crear, Editar, Eliminar, Obtener } = require('../Controladores/ClienteControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado', Tabla), Listado);
Router.get(`/${Modelo}/obtener/:codigo`, VerificarToken, VerificarPermisos('Ver', Tabla), Obtener);
Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear', Tabla), Crear);
Router.put(`/${Modelo}/editar/:codigo`, VerificarToken, VerificarPermisos('Editar', Tabla), Editar);
Router.delete(`/${Modelo}/eliminar/:codigo`, VerificarToken, VerificarPermisos('Eliminar', Tabla), Eliminar);

module.exports = Router;