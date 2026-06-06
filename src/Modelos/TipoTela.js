const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoTela', {
    CodigoTipoTela: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoTela: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTipoTela_NombreTipoTela"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoTela',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoTela_CodigoTipoTela",
        unique: true,
        fields: [
          { name: "CodigoTipoTela" },
        ]
      },
      {
        name: "Uq_CaTipoTela_NombreTipoTela",
        unique: true,
        fields: [
          { name: "NombreTipoTela" },
        ]
      },
    ]
  });
};
