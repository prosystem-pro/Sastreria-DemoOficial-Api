const Servicio = require('../Servicios/InformacionBd_Servicio'); 
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const ObtenerEspacioBD = async (req, res) => {
  try {
    const Objeto = await Servicio.EspacioBD();
    return ResponderExito(res, 'Información de la base de datos obtenida correctamente.', Objeto);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener información de la base de datos');
  }
};

module.exports = { ObtenerEspacioBD };
