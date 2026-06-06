const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoCuello', {
    CodigoTipoCuello: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoCuello: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTipoCuello_NombreTipoCuello"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoCuello',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoCuello_CodigoTipoCuello",
        unique: true,
        fields: [
          { name: "CodigoTipoCuello" },
        ]
      },
      {
        name: "Uq_CaTipoCuello_NombreTipoCuello",
        unique: true,
        fields: [
          { name: "NombreTipoCuello" },
        ]
      },
    ]
  });
};
