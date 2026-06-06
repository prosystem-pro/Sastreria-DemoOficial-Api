const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Rol')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreRol';
const CodigoModelo = 'CodigoRol';

const Listado = async () => {
  return await Modelo.findAll({ where: { Estatus: [1, 2] } });
};

const ObtenerPorCodigo = async (Codigo) => {
  const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Registro) throw LanzarError('Registro no encontrado');
  return Registro;
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
      return null;
  }
};

const Crear = async (Datos) => {
  return await Modelo.create(Datos);
};

const Editar = async (Codigo, Datos) => {
  const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Registro) throw LanzarError('Registro no encontrado');
  await Registro.update(Datos);
  return Registro;
};

const Eliminar = async (Codigo) => {
  const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Registro) throw LanzarError('Registro no encontrado');
  await Registro.destroy();
  return Registro;
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };
