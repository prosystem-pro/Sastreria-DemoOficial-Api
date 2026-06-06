const Express = require('express');
const Router = Express.Router();

const { ObtenerTodasLasTablasConPermisos } = require('../FuncionIntermedia/ObtenerPermisosTablas');
const { ObtenerResumenPermisos   } = require('../Controladores/PermisoRolRecursoControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');

Router.get('/permisos-disponibles', VerificarToken, (req, res) => {
  try {
    const datos = ObtenerTodasLasTablasConPermisos();
    res.json(datos);
  } catch (error) {
    console.error('Error al obtener los permisos:', error);
    res.status(500).json({ mensaje: 'Error interno al obtener permisos' });
  }
});

Router.get(`/resumen-permisos`, VerificarToken, ObtenerResumenPermisos);

module.exports = Router;
