const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Pagos', {
    CodigoPagos: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoEmpresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Empresa',
        key: 'CodigoEmpresa'
      }
    },
    FechaDeposito: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    FechaVencimientoPago: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    FechaRegistro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    Monto: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    NumeroBoleta: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    UrlComprobante: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Pagos',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdPagos_CodigoPagos",
        unique: true,
        fields: [
          { name: "CodigoPagos" },
        ]
      },
    ]
  });
};
