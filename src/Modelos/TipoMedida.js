const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TipoMedida', {
    CodigoTipoMedida: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTipoMedida: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTipoMedida_NombreTipoMedida"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TipoMedida',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTipoMedida_CodigoTipoMedida",
        unique: true,
        fields: [
          { name: "CodigoTipoMedida" },
        ]
      },
      {
        name: "Uq_CaTipoMedida_NombreTipoMedida",
        unique: true,
        fields: [
          { name: "NombreTipoMedida" },
        ]
      },
    ]
  });
};
