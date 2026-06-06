const Express = require('express');
const Router = Express.Router();
const Modelo = 'permisorolrecurso';
const Tabla = 'PermisoRolRecurso'
const { Listado, ObtenerPorCodigo, Buscar, Crear, Editar,
    EliminarPorRol, FiltrarPermisos, FiltrarRecursos,
    FiltrarRoles, EliminarPorRolRecurso,
    EliminarPorRolRecursoPermiso, ObtenerResumenPermisos   } = require('../Controladores/PermisoRolRecursoControlador');
const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');


// Router.get(`/${Modelo}/listado`,VerificarToken, VerificarPermisos('Listado', Tabla), Listado);
// Router.get(`/${Modelo}/:CodigoRol/:CodigoPermiso/:CodigoRecurso`, VerificarToken, VerificarPermisos('VerUnidad', Tabla), ObtenerPorCodigo);
// Router.get(`/${Modelo}/buscar/:TipoBusqueda/:ValorBusqueda`, VerificarToken, VerificarPermisos('Buscar', Tabla), Buscar);
// Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear', Tabla), Crear);
// Router.put(`/${Modelo}/editar`, VerificarToken, VerificarPermisos('Editar', Tabla), Editar);
// Router.delete(`/${Modelo}/eliminar-por-rol/:CodigoRol`, VerificarToken, VerificarPermisos('EliminarRol', Tabla), EliminarPorRol);
// Router.delete(`/${Modelo}/eliminar-por-rol-recurso/:CodigoRol/:CodigoRecurso`, VerificarToken, VerificarPermisos('EliminarRolRecurso', Tabla), EliminarPorRolRecurso);
// Router.delete(`/${Modelo}/eliminar-por-rol-recurso-permiso/:CodigoRol/:CodigoRecurso/:CodigoPermiso`, VerificarToken, VerificarPermisos('EliminarRolRecursoPermiso', Tabla), EliminarPorRolRecursoPermiso);
// Router.get(`/${Modelo}/filtrar-roles`, VerificarToken, VerificarPermisos('VerRol', Tabla), FiltrarRoles);
// Router.get(`/${Modelo}/filtrar-recursos/:CodigoRol`, VerificarToken, VerificarPermisos('VerRecurso', Tabla), FiltrarRecursos);
// Router.get(`/${Modelo}-filtrar-permisos/:CodigoRol/:CodigoRecurso`, VerificarToken, VerificarPermisos('VerRolRecurso', Tabla), FiltrarPermisos);

// Router.get(`/${Modelo}/permisos-disponibles`, VerificarToken, VerificarPermisos('VerPermisoDisponibleTiempoReal', Tabla), (req, res) => {
//   const fs = require('fs');

//   const RutaArchivo = __filename;
//   const Contenido = fs.readFileSync(RutaArchivo, 'utf8');

//   const ExpReg = /VerificarPermisos\('(\w+)',\s*Tabla\)/g;
//   const ConjuntoPermisos = new Set();
//   let Coincidencia;

//   while ((Coincidencia = ExpReg.exec(Contenido)) !== null) {
//     ConjuntoPermisos.add(Coincidencia[1]);
//   }

//   const Permisos = Array.from(ConjuntoPermisos);

//   res.json({
//     Tabla,
//     Permisos
//   });
// });
Router.get(`/${Modelo}/listado`, VerificarToken, VerificarPermisos('Listado', Tabla), Listado);

Router.get(`/${Modelo}/:CodigoRol/:CodigoPermiso/:CodigoRecurso`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerPorCodigo);

Router.get(`/${Modelo}/buscar/:TipoBusqueda/:ValorBusqueda`, VerificarToken, VerificarPermisos('Buscar', Tabla), Buscar);

Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear', Tabla), Crear);

Router.put(`/${Modelo}/editar`, VerificarToken, VerificarPermisos('Editar', Tabla), Editar);

// Eliminaciones específicas
Router.delete(`/${Modelo}/eliminar-por-rol/:CodigoRol`, VerificarToken, VerificarPermisos('EliminarRol', Tabla), EliminarPorRol);
Router.delete(`/${Modelo}/eliminar-por-rol-recurso/:CodigoRol/:CodigoRecurso`, VerificarToken, VerificarPermisos('EliminarRolRecurso', Tabla), EliminarPorRolRecurso);
Router.delete(`/${Modelo}/eliminar-por-rol-recurso-permiso/:CodigoRol/:CodigoRecurso/:CodigoPermiso`, VerificarToken, VerificarPermisos('EliminarRolRecursoPermiso', Tabla), EliminarPorRolRecursoPermiso);

// Filtros
Router.get(`/${Modelo}/filtrar-roles`, VerificarToken, VerificarPermisos('VerRol', Tabla), FiltrarRoles);
Router.get(`/${Modelo}/filtrar-recursos/:CodigoRol`, VerificarToken, VerificarPermisos('VerRecurso', Tabla), FiltrarRecursos);
Router.get(`/${Modelo}-filtrar-permisos/:CodigoRol/:CodigoRecurso`, VerificarToken, VerificarPermisos('VerPermiso', Tabla), FiltrarPermisos);

// Resumen
Router.get(`/${Modelo}/resumen`, VerificarToken, VerificarPermisos('VerResumenPermisos', Tabla), ObtenerResumenPermisos);

// Permisos dinámicos
Router.get(`/${Modelo}/permisos-disponibles`, VerificarToken, VerificarPermisos('VerPermisoDisponibleTiempoReal', Tabla), (req, res) => {
  const fs = require('fs');

  const RutaArchivo = __filename;
  const Contenido = fs.readFileSync(RutaArchivo, 'utf8');

  const ExpReg = /VerificarPermisos\('(\w+)',\s*Tabla\)/g;
  const ConjuntoPermisos = new Set();
  let Coincidencia;

  while ((Coincidencia = ExpReg.exec(Contenido)) !== null) {
    ConjuntoPermisos.add(Coincidencia[1]);
  }

  const Permisos = Array.from(ConjuntoPermisos);

  res.json({
    Tabla,
    Permisos
  });
});

module.exports = Router;