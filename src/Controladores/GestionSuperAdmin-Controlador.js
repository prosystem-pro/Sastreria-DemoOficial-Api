// Controladores/Gestion-PanelMaestroControlador.js

const Servicio = require('../Servicios/GestionSuperAdmin-Servicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');
const { LanzarError } = require('../Utilidades/ErrorServicios');
// 0. LIMPIEZA PARA REPLICA Y DEJEAR VACÍO PARA NUEVO CLIENTE
const LimpiarBaseDatosReplicaCliente = async (req, res) => {
  try {
    const { SuperAdmin } = req.Datos;

    // 🔒 Seguridad fuerte
    if (!SuperAdmin) {
      LanzarError('No autorizado para ejecutar limpieza de base de datos', 403);
    }

    const Resultado = await Servicio.LimpiarBaseDatosReplicaCliente(SuperAdmin);

    return ResponderExito(
      res,
      'Base de datos limpiada correctamente.',
      Resultado
    );

  } catch (error) {
    return ManejarError(error, res, 'Error al limpiar la base de datos');
  }
};

// 1. LIMPIEZA TOTAL DE REGISTROS (✅ SOLO LLAMA, NO TIENE CÓDIGO DE BD)
const LimpiarSoloRegistrosTotal = async (req, res) => {
  try {
    const { SuperAdmin } = req.Datos;
    if (!SuperAdmin) LanzarError('No autorizado para ejecutar esta acción', 403);

    const Resultado = await Servicio.LimpiarSoloRegistrosTotal(SuperAdmin);
    return ResponderExito(res, 'Todos los registros eliminados, estructura conservada.', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al limpiar los registros de la base de datos');
  }
};

// 2. VACIADO TOTAL
const VaciarTotalBaseDatos = async (req, res) => {
  try {
    const { SuperAdmin } = req.Datos;
    if (!SuperAdmin) LanzarError('No autorizado para ejecutar esta acción', 403);

    const Resultado = await Servicio.VaciarTotalBaseDatos(SuperAdmin);
    return ResponderExito(res, 'Base de datos vaciada totalmente, todas las tablas eliminadas.', Resultado);
  } catch (error) {
    return ManejarError(error, res, 'Error al vaciar totalmente la base de datos');
  }
};


module.exports = {
  LimpiarBaseDatosReplicaCliente,
  LimpiarSoloRegistrosTotal,
  VaciarTotalBaseDatos
};