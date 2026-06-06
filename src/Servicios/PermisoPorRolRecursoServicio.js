const { PermisoRolRecursoModelo, PermisoModelo, RecursoModelo } = require('../Relaciones/Relaciones');
const { LanzarError } = require('../Utilidades/ErrorServicios');

const ObtenerPermisosPorRolYRecurso = async (CodigoRol, NombreRecurso, NombrePermiso) => {
  // Obtener Recurso y Permiso por nombre
  const recursoData = await RecursoModelo.findOne({ where: { NombreRecurso } });
  const permisoData = await PermisoModelo.findOne({ where: { NombrePermiso } });

  if (!recursoData || !permisoData) {
    LanzarError('El permiso no existe.', 404, 'Alerta');
  }

  // Buscar la relación exacta en PermisoRolRecurso
  const relacionData = await PermisoRolRecursoModelo.findOne({
    where: {
      CodigoRol,
      CodigoRecurso: recursoData.CodigoRecurso,
      CodigoPermiso: permisoData.CodigoPermiso
    }
  });

  if (!relacionData) {
    LanzarError('El permiso no existe.', 404, 'Alerta');
  }

  if (relacionData.Estatus !== 1) {
    LanzarError('Permiso inactivo.', 403, 'Alerta');
  }

  // Validar que el rol esté activo
  const rolData = await PermisoRolRecursoModelo.findOne({ where: { CodigoRol } });
  if (!rolData) {
    LanzarError(`El rol "${CodigoRol}" no existe.`, 404, 'Alerta');
  }
  if (rolData.Estatus !== 1) {
    LanzarError(`El rol "${CodigoRol}" está inactivo.`, 403, 'Alerta');
  }

  // Validar que el recurso esté activo
  if (recursoData.Estatus !== 1) {
    LanzarError(`El recurso "${NombreRecurso}" está inactivo.`, 403, 'Alerta');
  }

  // Validar que el permiso esté activo
  if (permisoData.Estatus !== 1) {
    LanzarError(`El permiso "${NombrePermiso}" está inactivo.`, 403, 'Alerta');
  }

  // Obtener todos los permisos del rol para este recurso
  const datos = await PermisoRolRecursoModelo.findAll({
    where: { CodigoRol, Estatus: 1 },
    include: [
      {
        model: PermisoModelo,
        as: 'Permiso',
        attributes: ['NombrePermiso', 'Estatus'],
        where: { Estatus: 1 }
      },
      {
        model: RecursoModelo,
        as: 'Recurso',
        attributes: ['NombreRecurso', 'Estatus'],
        where: { NombreRecurso, Estatus: 1 }
      }
    ],
    attributes: [],
    raw: true,
    nest: true
  });

  if (!datos || datos.length === 0) {
    LanzarError(`No se encontraron permisos para el rol ${CodigoRol} y recurso ${NombreRecurso}`, 404, 'Alerta');
  }

  const datosFiltrados = datos.filter(p => p.Permiso.Estatus === 1 && p.Recurso.Estatus === 1);
  return datosFiltrados.map(p => p.Permiso.NombrePermiso);
};

module.exports = { ObtenerPermisosPorRolYRecurso };
