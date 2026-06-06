const { Router } = require("express");
const { SubirImagen } = require("../Controladores/SubirImagenControlador");
const Tabla = 'Imagen'
const { Subir } = require("../FuncionIntermedia/SubirImagen");
const VerificarToken = require("../FuncionIntermedia/VerificarToken");
const VerificarPermisos = require("../FuncionIntermedia/VerificarPermisos");


const RutaAlmacenamiento = Router();
RutaAlmacenamiento.post("/subir-imagen",VerificarToken, VerificarPermisos('SubirImagen', Tabla), Subir.single("Imagen"), SubirImagen);

module.exports = RutaAlmacenamiento;
