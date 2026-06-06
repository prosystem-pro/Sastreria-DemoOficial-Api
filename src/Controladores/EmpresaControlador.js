const Servicio = require('../Servicios/EmpresaServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const ObtenerEmpresaPrincipal = async (req, res) => {
  try {
    const Objeto = await Servicio.ObtenerEmpresaPrincipal();
    return ResponderExito(res, 'Empresas tipo 1 obtenidas correctamente.', Objeto || []);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener las empresas tipo 1');
  }
};

const Listado = async (req, res) => {
  try {
    const Objeto = await Servicio.Listado();
    return ResponderExito(res, 'Listado obtenido correctamente.', Objeto || []);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener los registros');
  }
};

const ObtenerPorCodigo = async (req, res) => {
  try {
    const { Codigo } = req.params;
    const Objeto = await Servicio.ObtenerPorCodigo(Codigo);
    return ResponderExito(res, 'Registro obtenido correctamente.', Objeto);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener el registro');
  }
};

const Buscar = async (req, res) => {
  try {
    const { TipoBusqueda, ValorBusqueda } = req.params;
    const Objeto = await Servicio.Buscar(TipoBusqueda, ValorBusqueda);
    return ResponderExito(res, 'Búsqueda realizada correctamente.', Objeto);
  } catch (error) {
    return ManejarError(error, res, 'Error al realizar la búsqueda');
  }
};

const Crear = async (req, res) => {
  try {
    const creado = await Servicio.Crear(req.body);
    return ResponderExito(res, 'Se guardó el registro exitosamente.', creado, 201);
  } catch (error) {
    return ManejarError(error, res, 'Error al crear el registro');
  }
};

const Editar = async (req, res) => {
  try {
    const { Codigo } = req.params;
    const actualizado = await Servicio.Editar(Codigo, req.body);
    return ResponderExito(res, 'Se actualizó el registro exitosamente.', actualizado);
  } catch (error) {
    return ManejarError(error, res, 'Error al actualizar el registro');
  }
};

const Eliminar = async (req, res) => {
  try {
    const { Codigo } = req.params;
    const eliminado = await Servicio.Eliminar(Codigo);
    return ResponderExito(res, 'Registro eliminado exitosamente.', eliminado);
  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar el registro');
  }
};


module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar, ObtenerEmpresaPrincipal };
