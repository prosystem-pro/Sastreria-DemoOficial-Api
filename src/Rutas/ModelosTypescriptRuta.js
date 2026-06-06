const Express = require("express");
const Router = Express.Router();
const { GenerarModelosControlador } = require("../Controladores/GenerarModeloTypescriptControlador");

Router.get("/generar-modelos", GenerarModelosControlador);

module.exports = Router;
