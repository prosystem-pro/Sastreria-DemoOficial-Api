const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Color', {
    CodigoColor: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreColor: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaColor_NombreColor"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Color',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaColor_CodigoColor",
        unique: true,
        fields: [
          { name: "CodigoColor" },
        ]
      },
      {
        name: "Uq_CaColor_NombreColor",
        unique: true,
        fields: [
          { name: "NombreColor" },
        ]
      },
    ]
  });
};
