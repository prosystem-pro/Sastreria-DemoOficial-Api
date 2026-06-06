const { IniciarSesionServicio } = require('../Servicios/LoginServicio');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');
const ManejarError = require('../Utilidades/ErrorControladores');

const IniciarSesion = async (req, res) => {
  try {
    const Resultado = await IniciarSesionServicio(req.body.NombreUsuario, req.body.Clave);
    return ResponderExito(res, 'Inicio de sesión exitoso', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al iniciar sesión', 401);
  }
};

module.exports = { IniciarSesion };
