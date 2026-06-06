const Servicio = require('../Servicios/PermisoRolRecursoServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');

const Listado = async (req, res) => {
  try {
    const Resultado = await Servicio.Listado();
    return ResponderExito(res, 'Listado de permisos rol-recurso obtenido', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener los registros');
  }
};

const ObtenerPorCodigo = async (req, res) => {
  try {
    const { CodigoRol, CodigoPermiso, CodigoRecurso } = req.params;
    const Resultado = await Servicio.ObtenerPorCodigo(CodigoRol, CodigoPermiso, CodigoRecurso);
    return ResponderExito(res, 'Registro obtenido', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener el registro');
  }
};

const Buscar = async (req, res) => {
  try {
    const { TipoBusqueda, ValorBusqueda } = req.params;
    const Resultado = await Servicio.Buscar(TipoBusqueda, ValorBusqueda);
    return ResponderExito(res, 'Búsqueda realizada con éxito', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al realizar la búsqueda');
  }
};

const Crear = async (req, res) => {
  try {
    await Servicio.Crear(req.body);
    return ResponderExito(res, 'Registro creado exitosamente', null, 201);
  } catch (error) {
    return ManejarError(error, res, 'Error al crear el registro');
  }
};

const Editar = async (req, res) => {
  try {
    await Servicio.Editar(req.body);
    return ResponderExito(res, 'Registro actualizado exitosamente');
  } catch (error) {
    return ManejarError(error, res, 'Error al actualizar el registro');
  }
};

const EliminarPorRol = async (req, res) => {
  try {
    const { CodigoRol } = req.params;
    const resultado = await Servicio.EliminarPorRol(CodigoRol);
    return ResponderExito(res, resultado.mensaje || 'Registros eliminados exitosamente');
  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar los registros del rol');
  }
};

const EliminarPorRolRecurso = async (req, res) => {
  try {
    const { CodigoRol, CodigoRecurso } = req.params;
    const cantidad = await Servicio.EliminarPorRolRecurso(CodigoRol, CodigoRecurso);
    return ResponderExito(res, `Se eliminaron ${cantidad} registros para el rol ${CodigoRol} y recurso ${CodigoRecurso}`);
  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar los registros por rol y recurso');
  }
};

const EliminarPorRolRecursoPermiso = async (req, res) => {
  try {
    const { CodigoRol, CodigoRecurso, CodigoPermiso } = req.params;
    const cantidadEliminada = await Servicio.EliminarPorPermisoRolRecurso(CodigoRol, CodigoRecurso, CodigoPermiso);
    return ResponderExito(res, `Registro eliminado correctamente con rol ${CodigoRol}, recurso ${CodigoRecurso} y permiso ${CodigoPermiso}`);
  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar el registro por rol, recurso y permiso');
  }
};

const FiltrarRoles = async (req, res) => {
  try {
    const roles = await Servicio.FiltrarRoles();
    return ResponderExito(res, 'Roles filtrados correctamente', roles);
  } catch (error) {
    return ManejarError(error, res, 'Error al filtrar roles con recursos incompletos');
  }
};

const FiltrarRecursos = async (req, res) => {
  try {
    const { CodigoRol } = req.params;
    const recursos = await Servicio.FiltrarRecursos(CodigoRol);
    return ResponderExito(res, 'Recursos filtrados correctamente', recursos);
  } catch (error) {
    return ManejarError(error, res, 'Error al filtrar recursos');
  }
};

const FiltrarPermisos = async (req, res) => {
  try {
    const { CodigoRol, CodigoRecurso } = req.params;
    const permisos = await Servicio.FiltrarPermisos(CodigoRol, CodigoRecurso);
    return ResponderExito(res, 'Permisos filtrados correctamente', permisos);
  } catch (error) {
    return ManejarError(error, res, 'Error al filtrar permisos');
  }
};

const ObtenerResumenPermisos = async (req, res) => {
  try {
    const permisosUnicos = await Servicio.ObtenerResumenPermisosUnicos();
    return ResponderExito(res, 'Resumen de permisos obtenido', { permisos: permisosUnicos });
  } catch (error) {
    return ManejarError(error, res, 'Error al obtener resumen de permisos');
  }
};

module.exports = {
  Listado, ObtenerPorCodigo,
  Buscar, Crear,
  Editar, FiltrarRoles,
  FiltrarRecursos, FiltrarPermisos,
  EliminarPorRol, EliminarPorRolRecurso,
  EliminarPorRolRecursoPermiso,
  ObtenerResumenPermisos
};
