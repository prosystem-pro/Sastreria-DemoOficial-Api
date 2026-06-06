const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Pago', {
    CodigoPago: {
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
    CodigoFormaPago: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'FormaPago',
        key: 'CodigoFormaPago'
      }
    },
    CodigoUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    NumeroDocumento: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    SaldoAnterior: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false
    },
    SaldoPendiente: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false
    },
    Serie: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    TipoDocumento: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Numero: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    FechaPago: {
      type: DataTypes.DATE,
      allowNull: false
    },
    Monto: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false
    },
    NumeroComprobante: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    UrlImagen: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Observacion: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Estatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    FechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('sysdatetime')
    }
  }, {
    sequelize,
    tableName: 'Pago',
    schema: 'Fn',
    timestamps: false,
    indexes: [
      {
        name: "PK_Fn_Pago",
        unique: true,
        fields: [
          { name: "CodigoPago" },
        ]
      },
    ]
  });
};
