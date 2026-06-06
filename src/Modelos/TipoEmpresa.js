const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoEmpresa', {
    CodigoTipoEmpresa: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoEmpresa: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTipoEmpresa_NombreTipoEmpresa"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoEmpresa',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoEmpresa_CodigoTipoEmpresa",
        unique: true,
        fields: [
          { name: "CodigoTipoEmpresa" },
        ]
      },
      {
        name: "Uq_CaTipoEmpresa_NombreTipoEmpresa",
        unique: true,
        fields: [
          { name: "NombreTipoEmpresa" },
        ]
      },
    ]
  });
};
