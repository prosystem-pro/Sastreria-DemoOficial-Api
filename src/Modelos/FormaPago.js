const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FormaPago', {
    CodigoFormaPago: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreFormaPago: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaFormaPago_CodigoFormaPago"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'FormaPago',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaFormaPago_CodigoFormaPago",
        unique: true,
        fields: [
          { name: "CodigoFormaPago" },
        ]
      },
      {
        name: "Uq_CaFormaPago_CodigoFormaPago",
        unique: true,
        fields: [
          { name: "NombreFormaPago" },
        ]
      },
    ]
  });
};
