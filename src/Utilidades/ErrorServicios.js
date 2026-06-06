function LanzarError(mensaje, statusCode = 400, tipo = 'Alerta') {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  error.tipo = tipo;
  throw error;
}

module.exports = { LanzarError };