const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Rol', {
    CodigoRol: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreRol: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_Adrol_NombreRol"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Rol',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdRol_CodigoRol",
        unique: true,
        fields: [
          { name: "CodigoRol" },
        ]
      },
      {
        name: "Uq_Adrol_NombreRol",
        unique: true,
        fields: [
          { name: "NombreRol" },
        ]
      },
    ]
  });
};
