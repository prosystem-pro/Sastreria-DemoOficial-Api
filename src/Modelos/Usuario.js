const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Usuario', {
    CodigoUsuario: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoEmpresa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Empresa',
        key: 'CodigoEmpresa'
      },
      unique: "Uq_AdUsuario_NombreUsuario"
    },
    CodigoRol: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Rol',
        key: 'CodigoRol'
      }
    },
    NombreUsuario: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_AdUsuario_NombreUsuario"
    },
    ClaveHash: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    ClaveSalt: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    SuperAdmin: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Usuario',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdUsuario_CodigoUsuario",
        unique: true,
        fields: [
          { name: "CodigoUsuario" },
        ]
      },
      {
        name: "Uq_AdUsuario_NombreUsuario",
        unique: true,
        fields: [
          { name: "CodigoEmpresa" },
          { name: "NombreUsuario" },
        ]
      },
    ]
  });
};
