const Cors = require('cors');

const OpcionesCors = {
  origin: process.env.URL_CORS.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const ConfiguracionCors = () => Cors(OpcionesCors);

module.exports = { ConfiguracionCors };
