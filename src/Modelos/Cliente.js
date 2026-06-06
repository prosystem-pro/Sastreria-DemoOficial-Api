const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Cliente', {
    CodigoCliente: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CodigoEmpresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Empresa',
        key: 'CodigoEmpresa'
      },
      unique: "Uq_CaCliente_NombreCliente"
    },
    NombreCliente: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaCliente_NombreCliente"
    },
    NIT: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    Celular: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Direccion: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    Correo: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Cliente',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaCliente_CodigoCliente",
        unique: true,
        fields: [
          { name: "CodigoCliente" },
        ]
      },
      {
        name: "Uq_CaCliente_NombreCliente",
        unique: true,
        fields: [
          { name: "CodigoEmpresa" },
          { name: "NombreCliente" },
        ]
      },
    ]
  });
};
