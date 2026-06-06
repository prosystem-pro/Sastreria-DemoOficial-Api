const Express = require("express");
const Router = Express.Router();
const { IniciarSesion } = require("../Controladores/LoginControlador");

Router.post("/login", IniciarSesion);

module.exports = Router;
