const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Empresa')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreEmpresa';
const CodigoModelo = 'CodigoEmpresa'

const ObtenerEmpresaPrincipal = async () => {
  return await Modelo.findAll({
    where: {
      CodigoTipoEmpresa: 1,
      Estatus: [1, 2]
    },
    order: [[NombreModelo, 'ASC']]
  });
};

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
        where: { [NombreModelo]: { [Sequelize.Op.like]: `%${ValorBusqueda}%` }, Estatus: [1, 2] }
      });
    case 2:
      return await Modelo.findAll({ where: { Estatus: [1, 2] }, order: [[NombreModelo, 'ASC']] });
    default:
      LanzarError('Tipo de búsqueda inválido', 400);
  }
};
const Crear = async (Datos) => {
  return await Modelo.create(Datos);
};

const Editar = async (Codigo, Datos) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado', 404);
  await Objeto.update(Datos);
  return Objeto;
};

const Eliminar = async (Codigo) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado', 404);
  await Objeto.destroy();
  return Objeto;
};


module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar,
  ObtenerEmpresaPrincipal
 };
