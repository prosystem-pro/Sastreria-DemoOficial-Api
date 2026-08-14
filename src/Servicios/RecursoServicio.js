const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Recurso')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreRecurso';
const CodigoModelo = 'CodigoRecurso';

const Listado = async () => {
  try {
    return await Modelo.findAll({ where: { Estatus: [1, 2] } });
  } catch (error) {
    throw error;
  }
};

const ObtenerPorCodigo = async (Codigo) => {
  try {
    const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Objeto) return LanzarError('Registro no encontrado', 404);
    return Objeto;
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
        return LanzarError('Tipo de búsqueda inválido', 400);
    }
  } catch (error) {
    throw error;
  }
};

const Crear = async (Datos) => {
  try {
    if (!Datos || !Datos[NombreModelo]) return LanzarError('Datos inválidos para crear registro', 400);
    return await Modelo.create(Datos);
  } catch (error) {
    throw error;
  }
};

const Editar = async (Codigo, Datos) => {
  try {
    const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Objeto) return LanzarError('Registro no encontrado para editar', 404);
    await Objeto.update(Datos);
    return Objeto;
  } catch (error) {
    throw error;
  }
};

const Eliminar = async (Codigo) => {
  try {
    const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Objeto) return LanzarError('Registro no encontrado para eliminar', 404);
    await Objeto.destroy();
    return Objeto;
  } catch (error) {
    throw error;
  }
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };
