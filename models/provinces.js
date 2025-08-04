'use strict';
module.exports = (sequelize, DataTypes) => {
  const provinces = sequelize.define('provinces', {
    province_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    province: DataTypes.STRING
  }, {
    timestamps: false
  });
  provinces.associate = function (models) {
    // associations can be defined here
  };
  return provinces;
};