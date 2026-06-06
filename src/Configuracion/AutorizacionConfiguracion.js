const Jwt = require("jsonwebtoken");
const Bcrypt = require("bcryptjs");
require("dotenv").config();

const GenerarToken = (datos) => {
  return Jwt.sign(
    {
      CodigoUsuario: datos.CodigoUsuario,
      CodigoRol: datos.CodigoRol,
      NombreUsuario: datos.NombreUsuario,
      NombreRol: datos.NombreRol,
      CodigoEmpresa: datos.CodigoEmpresa,
      NombreEmpresa: datos.NombreEmpresa,
      SuperAdmin: datos.SuperAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const EncriptarClave = async (clave) => {
  const Salt = await Bcrypt.genSalt(10);
  const Hash = await Bcrypt.hash(clave, Salt);
  return { Salt, Hash };
};

const CompararClaves = async (clave, hash) => {
  return await Bcrypt.compare(clave, hash);
};

module.exports = { GenerarToken, EncriptarClave, CompararClaves };