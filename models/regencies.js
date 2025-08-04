'use strict';
module.exports = (sequelize, DataTypes) => {
  const regencies = sequelize.define('regencies', {
    city_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    province_id: DataTypes.INTEGER,
    province: DataTypes.STRING,
    type: DataTypes.STRING,
    city_name: DataTypes.STRING,
    postal_code: DataTypes.STRING,
    city: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.type + ' ' + this.city_name;
      },
    },
  }, {
    timestamps: false
  });
  regencies.associate = function (models) {
    // associations can be defined here
    // regencies.belongsTo(models.provinces, { foreignKey: 'province_id' });
  };
  return regencies;
};