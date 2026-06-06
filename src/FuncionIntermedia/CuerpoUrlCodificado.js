const Analizador = require('body-parser');

const CuerpoUrlCodificado = Analizador.urlencoded({ extended: true, limit: '10mb' });

module.exports = CuerpoUrlCodificado;
