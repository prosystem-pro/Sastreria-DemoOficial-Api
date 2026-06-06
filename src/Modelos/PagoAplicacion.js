const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PagoAplicacion', {
    CodigoPagoAplicacion: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoPago: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pago',
        key: 'CodigoPago'
      }
    },
    TipoDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    CodigoDocumento: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    MontoAplicado: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'PagoAplicacion',
    schema: 'Fn',
    timestamps: false,
    indexes: [
      {
        name: "PK_Fn_PagoAplicacion",
        unique: true,
        fields: [
          { name: "CodigoPagoAplicacion" },
        ]
      },
    ]
  });
};
