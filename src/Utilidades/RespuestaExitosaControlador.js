const ResponderExito = (res, mensaje = 'Operación exitosa', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    tipo: 'Éxito',
    message: mensaje,
    data
  });
};

module.exports = ResponderExito;
