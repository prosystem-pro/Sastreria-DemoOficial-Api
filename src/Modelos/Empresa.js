const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Empresa', {
    CodigoEmpresa: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoTipoEmpresa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TipoEmpresa',
        key: 'CodigoTipoEmpresa'
      }
    },
    NombreEmpresa: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: "Uq_AdEmpresa_NombreEmpresa"
    },
    RazonSocial: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    NIT: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    NombrePropietario: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    Correo: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Direccion: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    Telefono: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    Departamento: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    Municipio: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    ImagenUrl: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Eslogan: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Empresa',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdEmpresa_CodigoEmpresa",
        unique: true,
        fields: [
          { name: "CodigoEmpresa" },
        ]
      },
      {
        name: "Uq_AdEmpresa_NombreEmpresa",
        unique: true,
        fields: [
          { name: "NombreEmpresa" },
        ]
      },
    ]
  });
};
