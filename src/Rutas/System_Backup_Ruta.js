const Express = require('express');
const Router = Express.Router();
const Modelo = 'system-backup';
const Tabla = 'SystemBackup';

const { RespaldoCompleto, RestaurarRespaldoCompleto, RespaldoPorMes, BorrarDatosPorMes } = require('../Controladores/System_Backup_Controlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

Router.get(`/${Modelo}/respaldo-completo`, VerificarToken, VerificarPermisos('RespaldoCompleto', Tabla), RespaldoCompleto);
Router.post(`/${Modelo}/restaurar-respaldo-completo`, VerificarToken, VerificarPermisos('RestaurarRespaldoCompleto', Tabla), RestaurarRespaldoCompleto);
Router.get(`/${Modelo}/respaldo-por-mes`, VerificarToken, VerificarPermisos('RespaldoPorMes', Tabla), RespaldoPorMes);
Router.delete(`/${Modelo}/borrar-datos-por-mes`, VerificarToken, VerificarPermisos('BorrarDatosPorMes', Tabla), BorrarDatosPorMes);
module.exports = Router;