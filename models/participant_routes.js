'use strict';
module.exports = (sequelize, DataTypes) => {
  const participant_routes = sequelize.define('participant_routes', {
    participant_id: DataTypes.INTEGER,
    accuracy: DataTypes.INTEGER,
    speed: DataTypes.INTEGER,
    location: DataTypes.GEOMETRY,
  }, {});
  participant_routes.associate = function(models) {
    // associations can be defined here
  };
  return participant_routes;
};