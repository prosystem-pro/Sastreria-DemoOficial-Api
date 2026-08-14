const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { LanzarError } = require('../Utilidades/ErrorServicios');

const EspacioBD = async () => {
  try {
    // 1️⃣ Info general del espacio
    const [espacio] = await BaseDatos.query(`EXEC sp_spaceused`);
    if (!espacio || espacio.length === 0) {
      LanzarError('No se pudo obtener información de la base de datos', 500);
    }

    // 2️⃣ Info de archivos (para obtener el máximo asignado por hosting)
    const [archivos] = await BaseDatos.query(`
      SELECT 
        name AS NombreArchivo,
        type_desc AS TipoArchivo,
        CAST(size AS BIGINT) * 8 / 1024 AS TamanoActualMB,
        CASE WHEN max_size = -1 THEN NULL ELSE CAST(max_size AS BIGINT) * 8 / 1024 END AS TamanoMaxMB
      FROM sys.database_files
      WHERE type_desc = 'ROWS'; -- solo data file, no el log
    `);

    const archivoDatos = archivos.length > 0 ? archivos[0] : null;

    // 3️⃣ Valores que devuelve sp_spaceused
    const totalAsignado = espacio[0].database_size;              // ej: "11.00 MB"
    const espacioLibreInterno = espacio[0]['unallocated space']; // ej: "0.65 MB"

    // 🔹 convertir a número para cálculos
    const totalNum = parseFloat(totalAsignado.split(' ')[0]);
    const libreNum = parseFloat(espacioLibreInterno.split(' ')[0]);
    const unidad = totalAsignado.split(' ')[1];

    // 4️⃣ Ocupado dentro de lo asignado
    const ocupadoAsignadoNum = (totalNum - libreNum).toFixed(2);

    // 5️⃣ Nivel Global (máximo hosting)
    let espacioTotal = archivoDatos ? archivoDatos.TamanoMaxMB : null;
    let espacioOcupadoTotal = ocupadoAsignadoNum;
    let espacioLibreTotal = espacioTotal ? (espacioTotal - espacioOcupadoTotal).toFixed(2) : null;

    return {
      NombreBaseDatos: espacio[0].database_name,

      // 🔹 Sección Global (Hosting / límite máximo)
      Global: {
        EspacioTotal: espacioTotal ? `${espacioTotal} MB` : 'Desconocido',
        EspacioOcupado: `${espacioOcupadoTotal} MB`,
        EspacioLibre: espacioLibreTotal ? `${espacioLibreTotal} MB` : 'Desconocido'
      },

      // 🔹 Sección Asignada actualmente
      Asignado: {
        EspacioAsignado: `${totalNum} ${unidad}`,
        EspacioOcupado: `${ocupadoAsignadoNum} ${unidad}`,
        EspacioLibre: `${libreNum} ${unidad}`
      }
    };

  } catch (error) {
    throw error;
  }
};

module.exports = { EspacioBD };
