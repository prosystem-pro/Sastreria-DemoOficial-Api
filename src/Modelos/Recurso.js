const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Recurso', {
    CodigoRecurso: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreRecurso: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_AdRecurso_NombreRecurso"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Recurso',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdRecurso_CodigoRecurso",
        unique: true,
        fields: [
          { name: "CodigoRecurso" },
        ]
      },
      {
        name: "Uq_AdRecurso_NombreRecurso",
        unique: true,
        fields: [
          { name: "NombreRecurso" },
        ]
      },
    ]
  });
};
