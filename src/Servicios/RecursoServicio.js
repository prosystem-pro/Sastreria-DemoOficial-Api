const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Recurso')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreRecurso';
const CodigoModelo = 'CodigoRecurso';

const Listado = async () => {
  return await Modelo.findAll({ where: { Estatus: [1, 2] } });
};

const ObtenerPorCodigo = async (Codigo) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado', 404);
  return Objeto;
};

const Buscar = async (TipoBusqueda, ValorBusqueda) => {
  switch (parseInt(TipoBusqueda)) {
    case 1:
      return await Modelo.findAll({
        where: {
          [NombreModelo]: { [Sequelize.Op.like]: `%${ValorBusqueda}%` },
          Estatus: [1, 2]
        }
      });
    case 2:
      return await Modelo.findAll({
        where: { Estatus: [1, 2] },
        order: [[NombreModelo, 'ASC']]
      });
    default:
      LanzarError('Tipo de búsqueda inválido', 400);
  }
};

const Crear = async (Datos) => {
  if (!Datos || !Datos[NombreModelo]) LanzarError('Datos inválidos para crear registro', 400);
  return await Modelo.create(Datos);
};

const Editar = async (Codigo, Datos) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado para editar', 404);
  await Objeto.update(Datos);
  return Objeto;
};

const Eliminar = async (Codigo) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado para eliminar', 404);
  await Objeto.destroy();
  return Objeto;
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };
