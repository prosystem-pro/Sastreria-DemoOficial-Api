const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoCorte', {
    CodigoTipoCorte: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoCorte: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTipoCorte_NombreTipoCorte"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoCorte',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoCorte_CodigoTipoCorte",
        unique: true,
        fields: [
          { name: "CodigoTipoCorte" },
        ]
      },
      {
        name: "Uq_CaTipoCorte_NombreTipoCorte",
        unique: true,
        fields: [
          { name: "NombreTipoCorte" },
        ]
      },
    ]
  });
};
