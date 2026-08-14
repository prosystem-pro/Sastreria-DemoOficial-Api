const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Usuario')(BaseDatos, Sequelize.DataTypes);
const { EncriptarClave } = require('../Configuracion/AutorizacionConfiguracion');
const { Op } = require('sequelize');
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreUsuario';
const CodigoModelo = 'CodigoUsuario';

const Listado = async () => {
  try {
    return await Modelo.findAll({
      where: {
        Estatus: [1, 2],
        SuperAdmin: { [Op.is]: null }
      }
    });
  } catch (error) {
    throw error;
  }
};

const ObtenerPorCodigo = async (Codigo) => {
  try {
    const usuario = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!usuario) return LanzarError('Registro no encontrado');
    if (usuario.SuperAdmin !== null) return LanzarError('No se puede mostrar este registro');
    return usuario;
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
            Estatus: [1, 2],
            SuperAdmin: null
          }
        });
      case 2:
        return await Modelo.findAll({
          where: { Estatus: [1, 2], SuperAdmin: null },
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
    if (!Datos.Clave) return LanzarError('La clave es obligatoria');
    if ('SuperAdmin' in Datos && Datos.SuperAdmin !== null) {
      return LanzarError('No se puede asignar un valor a la columna Super Administrador');
    }

    const { Salt, Hash } = await EncriptarClave(Datos.Clave);
    Datos.ClaveHash = Hash;
    Datos.ClaveSalt = Salt;
    delete Datos.Clave;

    return await Modelo.create(Datos);
  } catch (error) {
    throw error;
  }
};

const Editar = async (Codigo, Datos) => {
  try {
    const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Objeto) return LanzarError('Registro no encontrado');

    if ('SuperAdmin' in Datos) {
      if (Objeto.SuperAdmin !== null) {
        return LanzarError('No se puede modificar la columna Super Administrador de este registro');
      }
      delete Datos.SuperAdmin;
    }

    if (Datos.Clave && Datos.Clave.trim() !== '') {
      const { Salt, Hash } = await EncriptarClave(Datos.Clave);
      Datos.ClaveHash = Hash;
      Datos.ClaveSalt = Salt;
      delete Datos.Clave;
    }

    await Objeto.update(Datos);
    return Objeto;
  } catch (error) {
    throw error;
  }
};

const Eliminar = async (Codigo) => {
  try {
    const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
    if (!Objeto) return LanzarError('Registro no encontrado');

    if ('SuperAdmin' in Objeto && Objeto.SuperAdmin !== null) {
      return LanzarError('No se puede eliminar un registro con Super Administrador asignado');
    }

    await Objeto.destroy();
    return Objeto;
  } catch (error) {
    throw error;
  }
};

module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar };