const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Tamano', {
    CodigoTamano: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: "Uq_CaTamano_NombreTamano"
    },
    NombreTamano: {
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
    tableName: 'Tamano',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTamano_CodigoTamano",
        unique: true,
        fields: [
          { name: "CodigoTamano" },
        ]
      },
      {
        name: "Uq_CaTamano_NombreTamano",
        unique: true,
        fields: [
          { name: "CodigoTamano" },
        ]
      },
    ]
  });
};
