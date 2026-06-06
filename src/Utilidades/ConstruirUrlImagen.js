const ConstruirUrlImagen = (rutaRelativa) => {
  if (!rutaRelativa) return null;
  const base = process.env.URL_PUBLICA_FIREBASE;
  return `${base}${rutaRelativa}`;
};

module.exports = { ConstruirUrlImagen };
