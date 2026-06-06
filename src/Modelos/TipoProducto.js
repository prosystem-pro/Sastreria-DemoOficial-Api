const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoProducto', {
    CodigoTipoProducto: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoProducto: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "Uq_CaTipoProducto_NombreTipoProducto"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoProducto',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoProducto_CodigoTipoProducto",
        unique: true,
        fields: [
          { name: "CodigoTipoProducto" },
        ]
      },
      {
        name: "Uq_CaTipoProducto_NombreTipoProducto",
        unique: true,
        fields: [
          { name: "NombreTipoProducto" },
        ]
      },
    ]
  });
};
