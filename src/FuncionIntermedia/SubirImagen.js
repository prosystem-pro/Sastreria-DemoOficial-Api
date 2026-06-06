const Multer = require("multer");
		
const Almacenamiento = Multer.memoryStorage();
const Subir = Multer({ storage: Almacenamiento });

module.exports = { Subir };