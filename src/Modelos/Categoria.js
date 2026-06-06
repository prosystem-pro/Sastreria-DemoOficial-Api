const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Categoria', {
    CodigoCategoria: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: "Uq_CaCategoria_NombreCategoria"
    },
    NombreCategoria: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Categoria',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaCategoria_CodigoCategoria",
        unique: true,
        fields: [
          { name: "CodigoCategoria" },
        ]
      },
      {
        name: "Uq_CaCategoria_NombreCategoria",
        unique: true,
        fields: [
          { name: "CodigoCategoria" },
        ]
      },
    ]
  });
};
