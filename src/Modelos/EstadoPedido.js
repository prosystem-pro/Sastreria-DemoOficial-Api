const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('EstadoPedido', {
    CodigoEstadoPedido: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreEstadoPedido: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaEstadoPedido_NombreEstadoPedido"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'EstadoPedido',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaEstadoPedido_CodigoEstadoPedido",
        unique: true,
        fields: [
          { name: "CodigoEstadoPedido" },
        ]
      },
      {
        name: "Uq_CaEstadoPedido_NombreEstadoPedido",
        unique: true,
        fields: [
          { name: "NombreEstadoPedido" },
        ]
      },
    ]
  });
};
