const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Estilo', {
    CodigoEstilo: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreEstilo: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaEstilo_NombreEstilo"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Estilo',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaEstilo_CodigoEstilo",
        unique: true,
        fields: [
          { name: "CodigoEstilo" },
        ]
      },
      {
        name: "Uq_CaEstilo_NombreEstilo",
        unique: true,
        fields: [
          { name: "NombreEstilo" },
        ]
      },
    ]
  });
};
