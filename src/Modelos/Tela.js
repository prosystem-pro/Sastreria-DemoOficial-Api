const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Tela', {
    CodigoTela: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoTipoTela: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoTela',
        key: 'CodigoTipoTela'
      }
    },
    NombreTela: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: "Uq_CaTela_NombreTela"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Tela',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTela_CodigoTela",
        unique: true,
        fields: [
          { name: "CodigoTela" },
        ]
      },
      {
        name: "Uq_CaTela_NombreTela",
        unique: true,
        fields: [
          { name: "NombreTela" },
        ]
      },
    ]
  });
};
