const Jwt = require("jsonwebtoken");
require("dotenv").config();

const ObtenerInformacionTokenRuta = (req, res, next) => {
  const Token = req.header("Authorization");

  if (!Token) {
    req.Datos = null;
    return next();
  }

  try {
    const Decodificado = Jwt.verify(Token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.Datos = Decodificado; 
  } catch (error) {

    req.Datos = null;
  }

  next(); 
};

module.exports = ObtenerInformacionTokenRuta;
