const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PedidoDetalle', {
    CodigoPedidoDetalle: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoPedido: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Pedido',
        key: 'CodigoPedido'
      }
    },
    CodigoInventario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Inventario',
        key: 'CodigoInventario'
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
    NombreTelaAleatorio: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    CodigoTipoCuello: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoCuello',
        key: 'CodigoTipoCuello'
      }
    },
    CodigoTipoSolapa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoSolapa',
        key: 'CodigoTipoSolapa'
      }
    },
    CodigoTipoCorte: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoCorte',
        key: 'CodigoTipoCorte'
      }
    },
    CodigoBoton: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Boton',
        key: 'CodigoBoton'
      }
    },
    CodigoAbertura: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Abertura',
        key: 'CodigoAbertura'
      }
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Codigo: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Color: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Referencia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    PrecioVenta: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: false
    },
    Subtotal: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: false
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'PedidoDetalle',
    schema: 'Op',
    timestamps: false,
    indexes: [
      {
        name: "Pk_OpPedidoDetalle_CodigoPedidoDetalle",
        unique: true,
        fields: [
          { name: "CodigoPedidoDetalle" },
        ]
      },
    ]
  });
};
