const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MovimientoInventario', {
    CodigoMovimientoInventario: {
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
    CodigoInventario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Inventario',
        key: 'CodigoInventario'
      }
    },
    CodigoUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'CodigoUsuario'
      }
    },
    TipoMovimiento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    OrigenMovimiento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    CodigoDocumento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    TipoDocumento: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    NumeroDocumento: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    StockAnterior: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    StockNuevo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Observacion: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    FechaMovimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('sysdatetime')
    }
  }, {
    sequelize,
    tableName: 'MovimientoInventario',
    schema: 'Inv',
    timestamps: false,
    indexes: [
      {
        name: "PK_Inv_MovimientoInventario",
        unique: true,
        fields: [
          { name: "CodigoMovimientoInventario" },
        ]
      },
    ]
  });
};
