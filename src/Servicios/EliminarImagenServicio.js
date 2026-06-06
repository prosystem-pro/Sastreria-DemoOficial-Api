const { Almacenamiento } = require("../Configuracion/FirebaseConfiguracion");
const { LanzarError } = require('../Utilidades/ErrorServicios');

const EliminarImagen = async (UrlImagen) => {
  try {
    if (!UrlImagen) return;

    const Ruta = UrlImagen.split(`https://storage.googleapis.com/${Almacenamiento.name}/`)[1];
    if (!Ruta) return;

    await Almacenamiento.file(Ruta).delete();
  } catch (error) {

  }
};

module.exports = { EliminarImagen };
