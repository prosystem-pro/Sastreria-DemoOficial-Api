const multer = require('multer');
const Servicio = require('../Servicios/System_Backup_Servicio');
const ManejarError = require('../Utilidades/ErrorControladores');
const { LanzarError } = require('../Utilidades/ErrorServicios');

// Multer en memoria — no guarda nada en disco, el buffer llega directo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB máximo
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.sql')) {
      return cb(new Error('Solo se permiten archivos .sql'));
    }
    cb(null, true);
  }
});

const RespaldoCompleto = async (req, res) => {
  try {
    const { SuperAdmin } = req.Datos;
    if (!SuperAdmin) LanzarError('No tienes permisos para realizar respaldos del sistema', 403);

    // Obtenemos los datos igual que antes
    const { contenidoSQL, nombreArchivo } = await Servicio.RespaldoCompleto();

    // 🟢 CAMBIO: AHORA MANDAMOS TODO POR SEPARADO, ES MÁS FÁCIL
    return res.json({
      nombreArchivo: nombreArchivo,   // 👈 AQUÍ VA EL NOMBRE PERFECTO
      contenidoSQL: contenidoSQL      // 👈 AQUÍ VA LO QUE TIENE EL ARCHIVO
    });

  } catch (error) {
    return ManejarError(error, res, 'Error al generar el respaldo completo');
  }
};

const RespaldoPorMes = async (req, res) => {
  try {
    // 🔒 SOLO SUPER ADMIN
    const { SuperAdmin } = req.Datos;
    if (!SuperAdmin) LanzarError('No tienes permisos para realizar esta operación', 403);

    // 📥 RECIBIMOS EL AÑO Y MES POR LA URL O QUERY: ?anio=2025&mes=1
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      LanzarError('Debes enviar los parámetros: anio y mes (ej: ?anio=2025&mes=1)', 400);
    }

    // 🚀 LLAMAMOS AL SERVICIO NUEVO
    const resultado = await Servicio.RespaldoPorMes(parseInt(anio), parseInt(mes));

    return res.json({
      mensaje: `Respaldo del mes ${mes}/${anio} generado correctamente`,
      nombreArchivo: resultado.nombreArchivo,
      contenidoSQL: resultado.contenidoSQL,
      resumen: resultado.resumen,
      rango_respaldado: resultado.rango_respaldado
    });

  } catch (error) {
    return ManejarError(error, res, 'Error al generar el respaldo mensual');
  }
};

const BorrarDatosPorMes = async (req, res) => {
  try {
    // 🔒 SOLO SUPER ADMIN
    const { SuperAdmin } = req.Datos;
    if (!SuperAdmin) LanzarError('No tienes permisos para realizar esta operación', 403);

    // 📥 RECIBIMOS EL AÑO Y MES A BORRAR
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      LanzarError('Debes enviar los parámetros: anio y mes (ej: ?anio=2025&mes=1)', 400);
    }

    // 🚀 LLAMAMOS AL SERVICIO DE Borrado
    const resultado = await Servicio.BorrarDatosPorMes(parseInt(anio), parseInt(mes));

    return res.json({
      mensaje: resultado.mensaje,
      registrosBorrados: resultado.registrosBorrados
    });

  } catch (error) {
    return ManejarError(error, res, 'Error al borrar datos del mes seleccionado');
  }
};

const RestaurarRespaldoCompleto = [
  upload.single('archivo'),
  async (req, res) => {
    try {
      const { SuperAdmin } = req.Datos;

      if (!SuperAdmin) {
        LanzarError('No tienes permisos para restaurar la base de datos', 403);
      }

      if (!req.file) {
        LanzarError('No se recibió ningún archivo .sql', 400);
      }

      // El buffer viene en memoria, lo convertimos a string
      const contenidoSQL = req.file.buffer.toString('utf8');

      const resultado = await Servicio.RestaurarRespaldoCompleto(contenidoSQL);

      return res.json({
        mensaje: 'Base de datos restaurada correctamente',
        totalSentencias: resultado.totalSentencias
      });

    } catch (error) {
      return ManejarError(error, res, 'Error al restaurar el respaldo');
    }
  }
];

module.exports = {
  RespaldoCompleto, RestaurarRespaldoCompleto,
  RespaldoPorMes,
  BorrarDatosPorMes
};