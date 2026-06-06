const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Pagos')(BaseDatos, Sequelize.DataTypes);
const { EliminarImagen } = require('../Servicios/EliminarImagenServicio');
const { ConstruirUrlImagen } = require('../Utilidades/ConstruirUrlImagen');
const { DateTime } = require('luxon');
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NumeroBoleta';
const CodigoModelo = 'CodigoPagos';

const Listado = async (Anio) => {
  const Registros = await Modelo.findAll({
    where: {
      Estatus: [1, 2, 3],
      [Sequelize.Op.and]: Sequelize.where(
        Sequelize.fn('YEAR', Sequelize.col('FechaVencimientoPago')),
        Anio
      )
    }
  });

  return Registros.map((r) => {
    const Dato = r.toJSON();

    if (Dato.FechaVencimientoPago) {
      const fecha = DateTime.fromJSDate(new Date(Dato.FechaVencimientoPago), { zone: 'utc' }).plus({ days: 1 });
      Dato.FechaVencimientoPago = fecha.toISODate(); // YYYY-MM-DD
    }

    if (Dato.UrlComprobante) {
      Dato.UrlComprobante = ConstruirUrlImagen(Dato.UrlComprobante);
    }
    return Dato;
  });
};


const ObtenerPorCodigo = async (Codigo) => {
  const Registro = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Registro) LanzarError('Registro no encontrado', 404);

  const Dato = Registro.toJSON();
  if (Dato.UrlComprobante) Dato.UrlComprobante = ConstruirUrlImagen(Dato.UrlComprobante);

  return Dato;
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
      LanzarError('Tipo de búsqueda no válido', 400);
  }
};

const Crear = async (Datos) => {
  const Nuevo = await Modelo.create(Datos);
  const Dato = Nuevo.toJSON();

  Dato.UrlComprobante = ConstruirUrlImagen(Dato.UrlComprobante);

  return Dato;
};

const Editar = async (Codigo, Datos) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado para actualizar', 404);

  await Objeto.update(Datos);

  const Dato = Objeto.toJSON();

  Dato.UrlComprobante = ConstruirUrlImagen(Dato.UrlComprobante);

  return Dato;
};

const Eliminar = async (Codigo) => {
  const Objeto = await Modelo.findOne({ where: { [CodigoModelo]: Codigo } });
  if (!Objeto) LanzarError('Registro no encontrado para eliminar', 404);

  const CamposImagen = [
    'UrlComprobante'
  ];

  for (const campo of CamposImagen) {
    const urlOriginal = Objeto[campo];
    if (urlOriginal) {
      const urlConstruida = ConstruirUrlImagen(urlOriginal);
      try {
        await EliminarImagen(urlConstruida);
      } catch {

      }
    }
  }
  await Objeto.destroy();
  return Objeto;
};

const ObtenerResumenGeneralPagos = async (Anio) => {
  try {
    const { Op, fn, col, where, literal } = Sequelize;

    const resumen = await Modelo.findAll({
      attributes: [
        [fn('COUNT', col('CodigoPagos')), 'CantidadPagos'],
        [fn('SUM', literal(`CASE WHEN UrlComprobante IS NOT NULL AND LTRIM(RTRIM(UrlComprobante)) <> '' THEN 1 ELSE 0 END`)), 'PagosConComprobante'],
        [fn('SUM', literal(`CASE WHEN UrlComprobante IS NULL OR LTRIM(RTRIM(UrlComprobante)) = '' THEN 1 ELSE 0 END`)), 'PagosSinComprobante'],
        [fn('SUM', literal(`
          CASE 
            WHEN (UrlComprobante IS NULL OR LTRIM(RTRIM(UrlComprobante)) = '')
            AND FechaVencimientoPago < GETDATE() THEN 1 
            ELSE 0 
          END
        `)), 'PagosVencidosSinComprobante'],
        [fn('SUM', literal(`
          CASE 
            WHEN (UrlComprobante IS NULL OR LTRIM(RTRIM(UrlComprobante)) = '')
            AND FechaVencimientoPago >= GETDATE()
            AND FechaVencimientoPago <= DATEADD(day, 3, GETDATE()) THEN 1 
            ELSE 0 
          END
        `)), 'PagosPorVencer'],
        [fn('SUM', literal(`
          CASE 
            WHEN (UrlComprobante IS NULL OR LTRIM(RTRIM(UrlComprobante)) = '')
            AND FechaVencimientoPago > DATEADD(day, 3, GETDATE()) THEN 1 
            ELSE 0 
          END
        `)), 'PagosConTiempo']
      ],
      where: {
        Estatus: [1, 2, 3],
        [Op.and]: where(fn('YEAR', col('FechaVencimientoPago')), Anio)
      },
      raw: true
    });

    const r = resumen[0] || {};

    const pagosPendientes = await Modelo.findAll({
      attributes: ['CodigoPagos', 'FechaVencimientoPago'],
      where: {
        Estatus: [1, 2, 3],
        [Op.and]: [
          where(fn('YEAR', col('FechaVencimientoPago')), Anio),
          {
            [Op.or]: [
              { UrlComprobante: null },
              where(fn('LTRIM', fn('RTRIM', col('UrlComprobante'))), '')
            ]
          }
        ]
      },
      raw: true
    });

    const ahora = DateTime.now().setZone('America/Guatemala').startOf('day');
    const diasPorVencer = [];
    const diasConTiempo = [];

    for (const pago of pagosPendientes) {
      if (!pago.FechaVencimientoPago) continue;

      const fechaISO = pago.FechaVencimientoPago instanceof Date
        ? pago.FechaVencimientoPago.toISOString().slice(0, 10)
        : pago.FechaVencimientoPago.toString().slice(0, 10);

      const fechaVencimiento = DateTime.fromISO(fechaISO, { zone: 'America/Guatemala' }).startOf('day');
      const diferencia = fechaVencimiento.diff(ahora, 'days').days;
      const diasRestantes = diferencia >= 0 ? Math.floor(diferencia) + 1 : Math.floor(diferencia);

      if (diasRestantes >= 0 && diasRestantes <= 3) {
        diasPorVencer.push(diasRestantes);
      } else if (diasRestantes > 3) {
        diasConTiempo.push(diasRestantes);
      }
    }

    return {
      CantidadPagos: parseInt(r.CantidadPagos) || 0,
      PagosConComprobante: parseInt(r.PagosConComprobante) || 0,
      PagosSinComprobante: parseInt(r.PagosSinComprobante) || 0,
      PagosVencidosSinComprobante: parseInt(r.PagosVencidosSinComprobante) || 0,
      PagosPorVencer: parseInt(r.PagosPorVencer) || 0,
      PagosPorVencer_DetalleDias: diasPorVencer,
      PagosConTiempo: parseInt(r.PagosConTiempo) || 0,
      PagosConTiempo_DetalleDias: diasConTiempo
    };

  } catch (error) {

    // 🔥 CLAVE: NO transformar errores de Sequelize
    if (error.name === 'SequelizeDatabaseError') {
      throw error;
    }

    // 🔥 Si ya es error controlado
    if (error.statusCode) {
      throw error;
    }

    // 🔥 Solo errores inesperados tuyos
    LanzarError('Error interno en resumen de pagos', 500);
  }
};



module.exports = { Listado, ObtenerPorCodigo, Buscar, Crear, Editar, Eliminar, ObtenerResumenGeneralPagos };
