const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoSolapa', {
    CodigoTipoSolapa: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: "Uq_CaTipoSolapa_NombreTipoSolapa"
    },
    NombreTipoSolapa: {
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
    tableName: 'TipoSolapa',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoSolapa_CodigoTipoSolapa",
        unique: true,
        fields: [
          { name: "CodigoTipoSolapa" },
        ]
      },
      {
        name: "Uq_CaTipoSolapa_NombreTipoSolapa",
        unique: true,
        fields: [
          { name: "CodigoTipoSolapa" },
        ]
      },
    ]
  });
};
