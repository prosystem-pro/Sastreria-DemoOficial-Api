const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PedidoDetalleMedida', {
    CodigoPedidoDetalleMedida: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoPedidoDetalle: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'PedidoDetalle',
        key: 'CodigoPedidoDetalle'
      }
    },
    CodigoTipoMedida: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoMedida',
        key: 'CodigoTipoMedida'
      }
    },
    Valor: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    Descripcion: {
      type: DataTypes.STRING(256),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'PedidoDetalleMedida',
    schema: 'Op',
    timestamps: false,
    indexes: [
      {
        name: "Pk_OpPedidoDetalleMedida_CodigoPedidoDetalleMendoza",
        unique: true,
        fields: [
          { name: "CodigoPedidoDetalleMedida" },
        ]
      },
    ]
  });
};
