const fs = require('fs');
const path = require('path');

const rutaRutas = path.join(__dirname, '../Rutas');

function extraerTablaYPermisos(rutaArchivo) {
  const contenido = fs.readFileSync(rutaArchivo, 'utf8');

  const regexTabla = /\b(?:const|let|var)\s+Tabla\s*=\s*['"`](.*?)['"`]/;
  const matchTabla = contenido.match(regexTabla);
  if (!matchTabla) return null;

  const nombreTabla = matchTabla[1];

  const regexPermisos = /VerificarPermisos\(['"`](.*?)['"`],\s*Tabla\)/g;
  const permisos = new Set();
  let match;
  while ((match = regexPermisos.exec(contenido)) !== null) {
    permisos.add(match[1]);
  }

  return {
    Tabla: nombreTabla,
    Permisos: Array.from(permisos)
  };
}

function ObtenerTodasLasTablasConPermisos() {
  const archivos = fs.readdirSync(rutaRutas).filter(nombre =>
    nombre.endsWith('.js')
  );

  const resultados = [];

  archivos.forEach(nombreArchivo => {
    const rutaCompleta = path.join(rutaRutas, nombreArchivo);
    const info = extraerTablaYPermisos(rutaCompleta);
    if (info) resultados.push(info);
  });

  return resultados;
}

module.exports = {
  ObtenerTodasLasTablasConPermisos
};
