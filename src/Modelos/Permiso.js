const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Permiso', {
    CodigoPermiso: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombrePermiso: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_AdPermiso_NombrePermiso"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Permiso',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdPermiso_CodigoPermiso",
        unique: true,
        fields: [
          { name: "CodigoPermiso" },
        ]
      },
      {
        name: "Uq_AdPermiso_NombrePermiso",
        unique: true,
        fields: [
          { name: "NombrePermiso" },
        ]
      },
    ]
  });
};
