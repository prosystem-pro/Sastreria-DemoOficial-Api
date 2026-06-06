const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Producto', {
    CodigoProducto: {
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
    CodigoTipoProducto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoProducto',
        key: 'CodigoTipoProducto'
      }
    },
    CodigoCategoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categoria',
        key: 'CodigoCategoria'
      }
    },
    NombreProducto: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaProducto_NombreProducto"
    },
    PrecioBase: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Producto',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaProducto_CodigoProducto",
        unique: true,
        fields: [
          { name: "CodigoProducto" },
        ]
      },
      {
        name: "Uq_CaProducto_NombreProducto",
        unique: true,
        fields: [
          { name: "NombreProducto" },
        ]
      },
    ]
  });
};
