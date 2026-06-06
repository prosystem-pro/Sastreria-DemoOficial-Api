const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Talla', {
    CodigoTalla: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NombreTalla: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "Uq_CaTalla_NombreTallA"
    },
    Estatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'Talla',
    schema: 'Ca',
    timestamps: false,
    indexes: [
      {
        name: "Pk_CaTalla_CodigoTalla",
        unique: true,
        fields: [
          { name: "CodigoTalla" },
        ]
      },
      {
        name: "Uq_CaTalla_NombreTallA",
        unique: true,
        fields: [
          { name: "NombreTalla" },
        ]
      },
    ]
  });
};
