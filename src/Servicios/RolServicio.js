const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Rol')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreRol';
const CodigoModelo = 'CodigoRol';

const Listado = async () => {
  try {
    return await Modelo.findAll({ where: { Estatus: [1, 2] } });
  } catch (error) {
    throw error;
  }
};

const ObtenerPorCodigo = async (Codigo) => {
  try {
    const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Registro) return LanzarError('Registro no encontrado');
    return Registro;
  } catch (error) {
    throw error;
  }
};

const Buscar = async (TipoBusqueda, ValorBusqueda) => {
  try {
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
        return LanzarError('Tipo de búsqueda no válido', 400);
    }
  } catch (error) {
    throw error;
  }
};

const Crear = async (Datos) => {
  try {
    return await Modelo.create(Datos);
  } catch (error) {
    throw error;
  }
};

const Editar = async (Codigo, Datos) => {
  try {
    const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Registro) return LanzarError('Registro no encontrado');
    await Registro.update(Datos);
    return Registro;
  } catch (error) {
    throw error;
  }
};

const Eliminar = async (Codigo) => {
  try {
    const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Registro) return LanzarError('Registro no encontrado');
    await Registro.destroy();
    return Registro;
  } catch (error) {
    throw error;
  }
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };
