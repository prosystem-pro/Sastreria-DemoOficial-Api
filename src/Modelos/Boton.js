const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Boton', {
    CodigoBoton: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreBoton: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaBoton_NombreBoton"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Boton',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaBoton_CodigoBoton",
        unique: true,
        fields: [
          { name: "CodigoBoton" },
        ]
      },
      {
        name: "Uq_CaBoton_NombreBoton",
        unique: true,
        fields: [
          { name: "NombreBoton" },
        ]
      },
    ]
  });
};
