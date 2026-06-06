const Express = require('express');
const Router = Express.Router();
const Modelo = 'basedatos';
const Tabla = 'BaseDatos';
const { ObtenerEspacioBD } = require('../Controladores/InformacionBd_Controlador');

Router.get(`/${Modelo}/espaciobd`, ObtenerEspacioBD);

module.exports = Router;
