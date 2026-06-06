const Express = require('express');
const Router = Express.Router();
const { ObtenerResumenGeneralPagos } = require('../Controladores/PagoControlador');


Router.get(`/resumen-general-pagos/:anio`, ObtenerResumenGeneralPagos);


module.exports = Router;
