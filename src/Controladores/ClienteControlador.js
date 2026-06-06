// Controladores/ClienteControlador.js

const Servicio = require('../Servicios/ClienteServicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');
const { LanzarError } = require('../Utilidades/ErrorServicios');

const Listado = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;

    const Objeto = await Servicio.Listado(CodigoEmpresa, SuperAdmin);

    return ResponderExito(res, 'Listado de clientes obtenido correctamente.', Objeto || []);

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener los clientes');
  }
};

const Crear = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;

    if (SuperAdmin) {
      LanzarError('SuperAdmin no puede crear clientes sin empresa', 403);
    }

    const Objeto = await Servicio.Crear(req.body, CodigoEmpresa);

    return ResponderExito(
      res,
      'Cliente creado correctamente.',
      Objeto
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al crear el cliente');
  }
};

const Obtener = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;
    const Codigo = req.params.codigo;

    if (!Codigo) {
      LanzarError('El código de cliente es obligatorio', 400, 'Advertencia');
    }

    const Objeto = await Servicio.Obtener(Codigo, CodigoEmpresa, SuperAdmin);

    return ResponderExito(
      res,
      'Cliente obtenido correctamente.',
      Objeto || {}
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al obtener el cliente');
  }
};

const Editar = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;
    const Codigo = req.params.codigo;

    if (SuperAdmin) {
      LanzarError('SuperAdmin no puede editar clientes', 403);
    }

    const Objeto = await Servicio.Editar(Codigo, req.body, CodigoEmpresa);

    return ResponderExito(
      res,
      'Cliente actualizado correctamente.',
      Objeto
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al actualizar el cliente');
  }
};

const Eliminar = async (req, res) => {
  try {

    const { CodigoEmpresa, SuperAdmin } = req.Datos;
    const Codigo = req.params.codigo;

    await Servicio.Eliminar(Codigo, CodigoEmpresa, SuperAdmin);

    return ResponderExito(
      res,
      'Cliente eliminado correctamente.',
      true
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al eliminar el cliente');
  }
};

module.exports = { Listado, Crear, Editar, Eliminar, Obtener };