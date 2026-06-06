const Fs = require("fs");
const Ruta = require("path");
const ConexionBaseDatos = require("../BaseDatos/ConexionBaseDatos");
const Sequelize = require("sequelize");

const RutaModelos = Ruta.join(__dirname, "../Modelos");

const GenerarModelos = async () => {
  try {
    let ModelosTS = {};

    Fs.readdirSync(RutaModelos).forEach((archivo) => {
      if (archivo.endsWith(".js")) {
        const RutaModelo = Ruta.join(RutaModelos, archivo);
        const DefinicionModelo = require(RutaModelo);
        let modelo;

        if (typeof DefinicionModelo === "function") {
          modelo = DefinicionModelo(ConexionBaseDatos, Sequelize.DataTypes);
        } else {
          modelo = DefinicionModelo;
        }

        const NombreModelo = archivo.replace(".js", "");

        if (!modelo || !modelo.rawAttributes) {
          console.warn(`El modelo ${NombreModelo} no tiene rawAttributes. Se omite.`);
          return;
        }

        let InterfazTS = `export interface ${NombreModelo} {\n`;

        Object.keys(modelo.rawAttributes).forEach((clave) => {
          const tipoNombre = modelo.rawAttributes[clave].type.constructor.name.toLowerCase();
          let tipoTS = "any";

          if (tipoNombre.includes("string")) tipoTS = "string";
          if (tipoNombre.includes("integer") || tipoNombre.includes("float") || tipoNombre.includes("decimal")) tipoTS = "number";
          if (tipoNombre.includes("boolean")) tipoTS = "boolean";
          if (tipoNombre.includes("date")) tipoTS = "Date";

          InterfazTS += `  ${clave}: ${tipoTS};\n`;
        });

        InterfazTS += "}\n";

        ModelosTS[NombreModelo] = InterfazTS;
      }
    });

    return ModelosTS;
  } catch (error) {
    throw new Error("Error al generar modelos");
  }
};

module.exports = { GenerarModelos };
