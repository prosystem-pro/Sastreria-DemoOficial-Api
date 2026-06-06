const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Abertura', {
    CodigoAbertura: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreAbertura: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaAbertura_NombreAbertura"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Abertura',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaAbertura_CodigoAbertura",
        unique: true,
        fields: [
          { name: "CodigoAbertura" },
        ]
      },
      {
        name: "Uq_CaAbertura_NombreAbertura",
        unique: true,
        fields: [
          { name: "NombreAbertura" },
        ]
      },
    ]
  });
};
