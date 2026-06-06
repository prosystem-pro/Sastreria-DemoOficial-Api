const { Almacenamiento } = require("../Configuracion/FirebaseConfiguracion");
const { v4: GenerarUuid } = require("uuid");
const { LanzarError } = require("../Utilidades/ErrorControladores");

const SubirImagenAlmacenamiento = (Archivo, CarpetaPrincipal, SubCarpeta) => {
  return new Promise((Resolver, Rechazar) => {
    if (!CarpetaPrincipal || !SubCarpeta) {
      return Rechazar(LanzarError('ParametrosInvalidos', 'No se enviaron las carpetas necesarias'));
    }

    const NombreArchivo = `${CarpetaPrincipal}/${SubCarpeta}/${GenerarUuid()}-${Archivo.originalname}`;
    const ArchivoSubido = Almacenamiento.file(NombreArchivo);

    const Flujo = ArchivoSubido.createWriteStream({
      metadata: { contentType: Archivo.mimetype },
    });

    Flujo.on("error", () => {
      Rechazar(LanzarError('ErrorSubida', 'Error al subir la imagen'));
    });

    Flujo.on("finish", async () => {
      try {
        await ArchivoSubido.makePublic();
        Resolver(`/${NombreArchivo.replace(`${CarpetaPrincipal}/`, '')}`);
      } catch (error) {
        Rechazar(LanzarError('ErrorPublicar', 'Error al hacer pública la imagen'));
      }
    });

    Flujo.end(Archivo.buffer);
  });
};

module.exports = { SubirImagenAlmacenamiento };
