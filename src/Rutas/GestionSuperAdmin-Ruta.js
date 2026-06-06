const Express = require('express');
const Router = Express.Router();
const Modelo = 'gestionsuperadmin';
const Tabla = 'GestionSuperAdmin';

const { LimpiarBaseDatosReplicaCliente, LimpiarSoloRegistrosTotal, VaciarTotalBaseDatos } = require('../Controladores/GestionSuperAdmin-Controlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.post(`/${Modelo}/limpiar-basedatos-replica-cliente`, VerificarToken, VerificarPermisos('Eliminar', Tabla), LimpiarBaseDatosReplicaCliente);
Router.post(`/${Modelo}/limpiar-solo-registros-total`, VerificarToken, VerificarPermisos('Eliminar', Tabla), LimpiarSoloRegistrosTotal);
Router.post(`/${Modelo}/vaciar-total-basedatos`, VerificarToken, VerificarPermisos('Eliminar', Tabla), VaciarTotalBaseDatos);

module.exports = Router;