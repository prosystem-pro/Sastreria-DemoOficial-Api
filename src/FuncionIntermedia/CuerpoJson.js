const Express = require('express');
const CuerpoJson = Express.json({ type: 'application/json', limit: '10mb' });
module.exports = CuerpoJson;

