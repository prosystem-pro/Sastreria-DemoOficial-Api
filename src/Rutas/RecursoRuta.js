const Express = require('express');
const Router = Express.Router();
const Modelo = 'recurso';
const Tabla = 'Recurso'
const { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar } = require('../Controladores/RecursoControlador');
const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos'); 

// Router.get(`/${Modelo}/listado`,VerificarToken,VerificarPermisos('Listado',Tabla), Listado);
// Router.get(`/${Modelo}/:Codigo`,VerificarToken,VerificarPermisos('VerUnidad',Tabla), ObtenerPorCodigo);
// Router.get(`/${Modelo}/buscar/:TipoBusqueda/:ValorBusqueda`,VerificarToken,VerificarPermisos('Buscar',Tabla), Buscar);
// Router.post(`/${Modelo}/crear`, VerificarToken,VerificarPermisos('Crear', Tabla),Crear);
// Router.put(`/${Modelo}/editar/:Codigo`, VerificarToken,VerificarPermisos('Editar',Tabla), Editar);
// Router.delete(`/${Modelo}/eliminar/:Codigo`, VerificarToken,VerificarPermisos('Eliminar',Tabla),  Eliminar);
Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado', Tabla), Listado);
Router.get(`/${Modelo}/:Codigo`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerPorCodigo);
Router.get(`/${Modelo}/buscar/:TipoBusqueda/:ValorBusqueda`, VerificarToken, VerificarPermisos('Buscar', Tabla), Buscar);
Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear', Tabla), Crear);
Router.put(`/${Modelo}/editar/:Codigo`, VerificarToken, VerificarPermisos('Editar', Tabla), Editar);
Router.delete(`/${Modelo}/eliminar/:Codigo`, VerificarToken, VerificarPermisos('Eliminar', Tabla), Eliminar);

module.exports = Router;