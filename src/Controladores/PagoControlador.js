const Servicio = require('../Servicios/PagoServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const Listado = async (req, res) => {
  try {
    const { anio } = req.params;
    const Resultado = await Servicio.Listado(anio);
    return ResponderExito(res, 'Listado de pagos por año obtenido', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener registros por año');
  }
};

const ObtenerPorCodigo = async (req, res) => {
  try {
    const Resultado = await Servicio.ObtenerPorCodigo(req.params.Codigo);
    return ResponderExito(res, 'Pago obtenido', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener el registro');
  }
};

const Buscar = async (req, res) => {
  try {
    const Resultado = await Servicio.Buscar(req.params.TipoBusqueda, req.params.ValorBusqueda);
    return ResponderExito(res, 'Búsqueda de pagos exitosa', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al realizar la búsqueda');
  }
};

const Crear = async (req, res) => {
  try {
    await Servicio.Crear(req.body);
    return ResponderExito(res, 'Pago guardado exitosamente', null, 201);
  } catch (error) {
    return ManejarError(error, res, 'Error al crear el registro');
  }
};

const Editar = async (req, res) => {
  try {
    await Servicio.Editar(req.params.Codigo, req.body);
    return ResponderExito(res, 'Pago actualizado exitosamente');
  } catch (error) {
    return ManejarError(error, res, 'Error al actualizar el registro');
  }
};

const Eliminar = async (req, res) => {
  try {
    await Servicio.Eliminar(req.params.Codigo);
    return ResponderExito(res, 'Pago eliminado exitosamente');
  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar el registro');
  }
};

const ObtenerResumenGeneralPagos = async (req, res) => {
  try {
    const { anio } = req.params;
    const Resultado = await Servicio.ObtenerResumenGeneralPagos(anio);
    return ResponderExito(res, 'Resumen general de pagos obtenido', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener el resumen general de pagos');
  }
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar, ObtenerResumenGeneralPagos };
