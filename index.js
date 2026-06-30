require('dotenv').config();
process.env.TZ = 'UTC';

const os = require('os');
const App = require('./src/app');
const cron = require('node-cron');
const ServicioBackup = require('./src/Servicios/System_Backup_Servicio');
const ServicioDrive = require('./src/Servicios/GoogleDrive_Servicio');
const { Correo_Informe_respaldo } = require('./src/Servicios/Correo_Informe_Respaldo_Servicio');
const { DateTime } = require('luxon');

const PORT = process.env.PORT || 3000;
const MESES_A_MANTENER = 12;

const EvaluarYProcesarMesAntiguo = async () => {
  const fechaActual = DateTime.now().setZone('America/Guatemala');

  const mesActual = fechaActual.startOf('month');

  const mesLimite = mesActual.minus({ months: MESES_A_MANTENER });

  const mesAProcesar = mesLimite;

  const anio = mesAProcesar.year;
  const mes = mesAProcesar.month;
  const nombreMes = mesAProcesar.toFormat('MMMM');

  try {
    console.log(`🔍 Revisando si hay datos antiguos para: ${nombreMes} ${anio}`);
    const tieneDatos = await ServicioBackup.ExistenRegistrosPorMes(anio, mes);

    if (!tieneDatos) {
      return {
        procesado: false,
        mensaje: `ℹ️ Revisión realizada: No se encontraron registros correspondientes a ${nombreMes} ${anio}. Se mantienen los últimos ${MESES_A_MANTENER} meses.`
      };
    }

    console.log(`📤 Encontrados datos antiguos, generando respaldo de ${nombreMes} ${anio}`);
    const respaldoMes = await ServicioBackup.RespaldoPorMes(anio, mes);
    const rutaCarpeta = `${process.env.CARPETA_GRUPO || 'Sastrerias'}/${process.env.NOMBRE_EMPRESA || 'EMPRESA_SIN_NOMBRE'}/Respaldos Mensuales Antiguos/${anio}/${mes.toString().padStart(2, '0')} - ${nombreMes.toUpperCase()}`;
    const idCarpeta = await ServicioDrive.ObtenerOCrearRutaCarpeta(rutaCarpeta);
    const archivoSubido = await ServicioDrive.SubirArchivoEnCarpeta(respaldoMes.nombreArchivo, respaldoMes.contenidoSQL, idCarpeta);

    if (!archivoSubido.exito) throw new Error(`Error al subir: ${archivoSubido.error}`);

    const resultadoBorrado = await ServicioBackup.BorrarDatosPorMes(anio, mes);
    return {
      procesado: true,
      nombreMes,
      anio,
      registrosRespaldados: respaldoMes.resumen?.total_registros || 0,
      registrosEliminados: resultadoBorrado.registrosBorrados || 0,
      idArchivoDrive: archivoSubido.id,
      mensaje: `✅ PROCESADO: Mes ${nombreMes} ${anio} respaldado, subido a Drive y eliminado de la base.`
    };

  } catch (error) {
    return { procesado: false, error: true, mensaje: `❌ Error al procesar mes ${nombreMes} ${anio}: ${error.message}` };
  }
};

cron.schedule('0 4 * * *', async () => {
  try {
    const { contenidoSQL, nombreArchivo, resumen } = await ServicioBackup.RespaldoCompleto();
    const archivoSubido = await ServicioDrive.SubirArchivoRespaldo(nombreArchivo, contenidoSQL);
    resumen.subida_drive = archivoSubido.exito ? `EXITOSA | ID: ${archivoSubido.id}` : `FALLIDA | ${archivoSubido.error || 'Sin detalles'}`;
    resumen.revision_mes_antiguo = await EvaluarYProcesarMesAntiguo();
    await Correo_Informe_respaldo(resumen);
  } catch (error) {
    const resumenError = {
      fecha: DateTime.now().setZone('America/Guatemala').toFormat('yyyy-MM-dd HH:mm:ss'),
      estado: 'FALLIDO',
      base_datos: process.env.DB_NAME || 'Base de Datos Principal',
      error: error.message,
      revision_mes_antiguo: { mensaje: 'No se pudo realizar la revisión por error en el proceso principal' }
    };
    await Correo_Informe_respaldo(resumenError);
  }
}, { timezone: "America/Guatemala" });

const networkInterfaces = os.networkInterfaces();
let ipLocal = 'localhost';
for (const iface of Object.values(networkInterfaces).flat()) {
  if (iface.family === 'IPv4' && !iface.internal) ipLocal = iface.address;
}

App.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}/api`);
  console.log(`🚀 Servidor corriendo en: http://${ipLocal}:${PORT}/api`);
  console.log(`⚙️ Configurado para mantener los últimos ${MESES_A_MANTENER} meses en la base de datos`);
});

module.exports = App;
