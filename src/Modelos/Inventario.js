const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Inventario', {
    CodigoInventario: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoEmpresa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Empresa',
        key: 'CodigoEmpresa'
      }
    },
    CodigoProducto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Producto',
        key: 'CodigoProducto'
      }
    },
    CodigoMarca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Marca',
        key: 'CodigoMarca'
      }
    },
    CodigoTipoTela: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoTela',
        key: 'CodigoTipoTela'
      }
    },
    CodigoTela: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Tela',
        key: 'CodigoTela'
      }
    },
    CodigoEstilo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Estilo',
        key: 'CodigoEstilo'
      }
    },
    CodigoTalla: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Talla',
        key: 'CodigoTalla'
      }
    },
    CodigoTamano: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Tamano',
        key: 'CodigoTamano'
      }
    },
    CodigoColor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Color',
        key: 'CodigoColor'
      }
    },
    CodigoBarras: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    PrecioVenta: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: true
    },
    StockActual: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    StockMinimo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    StockMaximo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Estatus: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Inventario',
    schema: 'Inv',
    timestamps: false,
    indexes: [
      {
        name: "Pk_InvInventario_CodigoInventario",
        unique: true,
        fields: [
          { name: "CodigoInventario" },
        ]
      },
    ]
  });
};
