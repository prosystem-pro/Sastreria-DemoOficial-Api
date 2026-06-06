const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Permiso')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombrePermiso';
const CodigoModelo = 'CodigoPermiso';

const Listado = async () => {
  return await Modelo.findAll({ where: { Estatus: [1, 2] } });
};

const ObtenerPorCodigo = async (Codigo) => {
  const registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!registro) LanzarError('Registro no encontrado', 404);
  return registro;
};

const Buscar = async (TipoBusqueda, ValorBusqueda) => {
  switch (parseInt(TipoBusqueda)) {
    case 1:
      return await Modelo.findAll({
        where: { [NombreModelo]: { [Sequelize.Op.like]: `%${ValorBusqueda}%` }, Estatus: [1, 2] }
      });
    case 2:
      return await Modelo.findAll({ where: { Estatus: [1, 2] }, order: [[NombreModelo, 'ASC']] });
    default:
      LanzarError('Tipo de búsqueda inválido', 400);
  }
};

const Crear = async (Datos) => {
  if (!Datos || !Datos.NombrePermiso) LanzarError('Datos inválidos para crear registro', 400);
  return await Modelo.create(Datos);
};

const Editar = async (Codigo, Datos) => {
  const registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!registro) LanzarError('Registro no encontrado para editar', 404);
  await registro.update(Datos);
  return registro;
};

const Eliminar = async (Codigo) => {
  const registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!registro) LanzarError('Registro no encontrado para eliminar', 404);
  await registro.destroy();
  return registro;
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };
