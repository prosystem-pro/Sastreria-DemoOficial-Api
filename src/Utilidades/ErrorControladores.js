const ManejarError = (error, res, mensajeError = 'Error inesperado', statusCodeDefault = 500) => {
  const Desarrollo = process.env.ALERTA_ERRORES === 'Desarrollo';

  const statusCode = error.statusCode || statusCodeDefault;
  const tipo = error.tipo || (statusCode >= 500 ? 'Error' : 'Alerta');

  let mensajeReal = error.message;

  if (!mensajeReal && error.parent?.errors?.length > 0) {
    mensajeReal = error.parent.errors[0].message;
  }

  if (!mensajeReal && error.parent?.message) {
    mensajeReal = error.parent.message;
  }

  if (!mensajeReal && error.original?.message) {
    mensajeReal = error.original.message;
  }

  const DetallesError = {
    message: mensajeReal,
    stack: error.stack,
    type: error.name,
    innerError:
      error.parent?.errors?.[0]?.message ||
      error.parent?.message ||
      error.innerError?.message ||
      null,
    innerStack:
      error.parent?.errors?.[0]?.stack ||
      error.parent?.stack ||
      error.innerError?.stack ||
      null
  };

  console.error('Error detectado:', DetallesError);

  const respuesta = {
    success: false,
    tipo,
    message: mensajeError,
    error: Desarrollo
      ? DetallesError
      : { message: mensajeError }
  };

  return res.status(statusCode).json(respuesta);
};

module.exports = ManejarError;