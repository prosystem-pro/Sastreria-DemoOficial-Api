const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Marca', {
    CodigoMarca: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreMarca: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaMarca_NombreMarca"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Marca',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaMarca_CodigoMarca",
        unique: true,
        fields: [
          { name: "CodigoMarca" },
        ]
      },
      {
        name: "Uq_CaMarca_NombreMarca",
        unique: true,
        fields: [
          { name: "NombreMarca" },
        ]
      },
    ]
  });
};
