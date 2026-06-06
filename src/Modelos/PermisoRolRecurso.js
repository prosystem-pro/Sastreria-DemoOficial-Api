const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PermisoRolRecurso', {
    CodigoRol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Rol',
        key: 'CodigoRol'
      }
    },
    CodigoPermiso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Permiso',
        key: 'CodigoPermiso'
      }
    },
    CodigoRecurso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Recurso',
        key: 'CodigoRecurso'
      }
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'PermisoRolRecurso',
    schema: 'Ad',
    timestamps: false,
    indexes: [
      {
        name: "Pk_AdPermisoRolRecurso_CodigoRol_CodigoPermiso_CodigoRecurso",
        unique: true,
        fields: [
          { name: "CodigoRol" },
          { name: "CodigoPermiso" },
          { name: "CodigoRecurso" },
        ]
      },
    ]
  });
};
