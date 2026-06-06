require('dotenv').config();

process.env.TZ = 'UTC';

require('./src/Relaciones/Relaciones');

const os = require('os');
const App = require('./src/app');

const cron = require('node-cron');
const ServicioBackup = require('./src/Servicios/System_Backup_Servicio');
const ServicioDrive = require('./src/Servicios/GoogleDrive_Servicio');
const { DateTime } = require('luxon');

const PORT = process.env.PORT || 1433;


cron.schedule('0 5 * * *', async () => {
  
  try {
    const { contenidoSQL, nombreArchivo } = await ServicioBackup.RespaldoCompleto();

    await ServicioDrive.SubirArchivoRespaldo(nombreArchivo, contenidoSQL);

  } catch (error) {
    console.error('❌ === ERROR EN EL PROCESO DE RESPALDO === ', error.message);
  }

}, {
  timezone: "America/Guatemala"
});


const networkInterfaces = os.networkInterfaces();
let ipLocal = 'localhost';
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const iface of interfaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      ipLocal = iface.address;
      break;
    }
  }
}

App.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}/api`);
  console.log(`🚀 Servidor corriendo en: http://${ipLocal}:${PORT}/api`);
});

module.exports = App;
