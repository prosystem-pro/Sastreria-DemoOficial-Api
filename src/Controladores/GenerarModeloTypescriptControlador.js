const { GenerarModelos } = require("../Servicios/GenerarModeloTypescriptServicio");
const ManejarError = require("../Utilidades/ErrorControladores");
const ResponderExito = require("../Utilidades/RespuestaExitosaControlador");

const GenerarModelosControlador = async (req, res) => {
  try {
    const ModelosTS = await GenerarModelos();
    return ResponderExito(res, 'Modelos generados exitosamente.', ModelosTS);
  } catch (error) {
    return ManejarError(error, res, "Error al generar modelos");
  }
};

module.exports = { GenerarModelosControlador };
