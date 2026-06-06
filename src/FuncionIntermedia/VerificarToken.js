const Jwt = require("jsonwebtoken");
require("dotenv").config();
const ManejarError = require('../Utilidades/ErrorControladores');

const VerificarToken = (req, res, next) => {
  const Token = req.header("Authorization");

  if (!Token) {
    return res.status(401).json({ error: "Acceso denegado, token requerido" });
  }

  try {
    const Decodificado = Jwt.verify(Token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.Datos = Decodificado;

    if (Decodificado.SuperAdmin === 1) {
      return next();
    }

    next();
  } catch (error) {
    ManejarError(error, res, 'Token inválido');
  }
};

module.exports = VerificarToken;