const Path = require('path');

// Conexión a la base de datos
const BaseDatos = require(Path.join(__dirname, '..', 'BaseDatos', 'ConexionBaseDatos'));

// Importamos el archivo donde están las relaciones, que ya devuelve los modelos vinculados
const Modelos = require(Path.join(__dirname, '..', 'Relaciones', 'relaciones'));

async function verificarRelaciones() {


  for (const [nombreModelo, Modelo] of Object.entries(Modelos)) {
    if (!Modelo) {
      continue;
    }

    const associations = Object.values(Modelo.associations || {});
    if (associations.length === 0) {
      continue;
    }

    for (const assoc of associations) {
      try {
        await Modelo.findAll({ limit: 1, include: [assoc] });
      } catch (error) {
      }
    }
  }

  process.exit(0);
}

BaseDatos.authenticate()
  .then(() => {
    verificarRelaciones();
  })
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  });