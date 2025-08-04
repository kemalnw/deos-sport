'use strict';
module.exports = (sequelize, DataTypes) => {
  const organizations = sequelize.define('organizations', {
    name: DataTypes.STRING,
    pic: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING
  }, {});
  organizations.associate = function (models) {
    // associations can be defined here
    organizations.hasMany(models.users, { foreignKey: 'organization_id', as: 'user' });
    organizations.hasMany(models.events, { foreignKey: 'organization_id', as: 'event' });
    // organizations.belongsToMany(models.events, { through: 'events', targetKey: 'organization_id', as: 'organization_events' });
  };
  return organizations;
};