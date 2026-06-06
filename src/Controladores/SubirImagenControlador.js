const ManejarError = require('../Utilidades/ErrorControladores');
const ResponderExito = require('../Utilidades/RespuestaExitosaControlador');
const { SubirImagenAlmacenamiento } = require("../Servicios/SubirImagenServicio");
const { EliminarImagen } = require("../Servicios/EliminarImagenServicio");
const { Almacenamiento } = require("../Configuracion/FirebaseConfiguracion");

const Servicios = {
  Empresa: require("../Servicios/EmpresaServicio"),
};

const SubirImagen = async (req, res) => {
  let RutaRelativa = "";
  let UrlPublica = "";
  let ImagenAnterior = ""; 
  let EstaEditando = false;

  try {
    if (!req.file) {
      return ManejarError({ message: "No se envió ninguna imagen", statusCode: 400 }, res, "Error al procesar la imagen");
    }

    const {
      CarpetaPrincipal,
      SubCarpeta,
      CodigoVinculado,
      CodigoPropio,
      CampoVinculado,
      CampoPropio,
      NombreCampoImagen,
    } = req.body;

    if (!CarpetaPrincipal || !SubCarpeta) {
      return ManejarError({ message: "Las carpetas son obligatorias", statusCode: 400 }, res, "Error al procesar la imagen");
    }

    const Servicio = Servicios[SubCarpeta];
    if (!Servicio) {
      return ManejarError({ message: `No hay servicio para la carpeta ${SubCarpeta}`, statusCode: 400 }, res, "Error al procesar la imagen");
    }

    const [archivos] = await Almacenamiento.getFiles({
      prefix: `${CarpetaPrincipal}/`
    });

    let totalBytes = 0;
    for (const archivo of archivos) {
      const [metadata] = await archivo.getMetadata();
      totalBytes += Number(metadata.size || 0);
    }

    if (totalBytes >= 950 * 1024 * 1024) {
      return ManejarError({ message: "El límite de almacenamiento ha sido alcanzado. No se puede subir más imágenes.", statusCode: 400 }, res, "Error al procesar la imagen");
    }

    let CuentaComoNuevaImagen = false;

    if (!CodigoPropio && CodigoVinculado) {
      CuentaComoNuevaImagen = true;
    } else if (CodigoPropio) {
      const EntidadExistente = await Servicio.ObtenerPorCodigo(CodigoPropio);

      if (!EntidadExistente) {
        return ManejarError({ message: "No se encontró el registro a editar, se alcanzó el límite máximo de imágenes permitidas", statusCode: 400 }, res, "Error al procesar la imagen");
      }

      const ImagenActual = EntidadExistente[NombreCampoImagen];
      if (!ImagenActual || ImagenActual.trim() === '') {
        CuentaComoNuevaImagen = true;
      }
    } else {
      CuentaComoNuevaImagen = true;
    }

    if (CuentaComoNuevaImagen && archivos.length >= 250) {
      return ManejarError({ message: "Se alcanzó el límite máximo de imágenes permitidas", statusCode: 400 }, res, "Error al procesar la imagen");
    }

    RutaRelativa = await SubirImagenAlmacenamiento(req.file, CarpetaPrincipal, SubCarpeta);
    UrlPublica = `${process.env.URL_PUBLICA_FIREBASE}${RutaRelativa}`;

    let Entidad = {};
    let Datos = {};

    if (CodigoVinculado && !CodigoPropio) {
      Datos[CampoVinculado] = CodigoVinculado;
      Datos[NombreCampoImagen] = RutaRelativa;
      Entidad = await Servicio.Crear(Datos);

    } else if (!CodigoVinculado && CodigoPropio) {
      EstaEditando = true;
      Datos[CampoPropio] = CodigoPropio;
      const EntidadExistente = await Servicio.ObtenerPorCodigo(CodigoPropio);

      if (EntidadExistente && EntidadExistente[NombreCampoImagen]) {
        ImagenAnterior = EntidadExistente[NombreCampoImagen]; // solo si hay una existente
      }

      Datos[NombreCampoImagen] = RutaRelativa;
      Entidad = await Servicio.Editar(CodigoPropio, Datos);

    } else if (CodigoVinculado && CodigoPropio) {
      EstaEditando = true;
      Datos[CampoVinculado] = CodigoVinculado;
      Datos[CampoPropio] = CodigoPropio;

      const EntidadExistente = await Servicio.ObtenerPorCodigo(CodigoPropio);

      if (EntidadExistente && EntidadExistente[NombreCampoImagen]) {
        ImagenAnterior = EntidadExistente[NombreCampoImagen];
      }

      Datos[NombreCampoImagen] = RutaRelativa;
      Entidad = await Servicio.Editar(CodigoPropio, Datos);

    } else {
      Datos[NombreCampoImagen] = RutaRelativa;
      Entidad = await Servicio.Crear(Datos);
    }
    // === SI LLEGA HASTA AQUÍ, LA EDICIÓN FUE EXITOSA Y PODEMOS BORRAR LA ANTERIOR ===
    if (EstaEditando && ImagenAnterior) {
      await EliminarImagen(ImagenAnterior);
    }

    return ResponderExito(res, `${SubCarpeta} procesado con éxito`, { Entidad, UrlImagenPublica: UrlPublica }, 201);

  } catch (error) {
    if (UrlPublica) {
      try {
        await EliminarImagen(UrlPublica);
      } catch (errEliminar) {
        console.error("Error eliminando imagen subida tras fallo:", errEliminar.message);
      }
    }
    return ManejarError(error, res, "Error al procesar la imagen");
  }
};

module.exports = { SubirImagen };
