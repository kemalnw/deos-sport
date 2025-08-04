'use strict';
module.exports = (sequelize, DataTypes) => {
  const events = sequelize.define('events', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    photo: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('photo');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    registration_fee: DataTypes.DECIMAL(10, 2),
    reward: DataTypes.INTEGER,
    distance: DataTypes.INTEGER,
    duration: DataTypes.TIME,
    is_final: DataTypes.INTEGER,
    organization_id: DataTypes.INTEGER,
    type: {
      type: DataTypes.INTEGER,
      default: 0
    },
    speed_limit: DataTypes.INTEGER,
    cheat_counter_max: DataTypes.INTEGER
  }, {});
  events.associate = function (models) {
    // associations can be defined here
    events.belongsTo(models.organizations, { foreignKey: 'organization_id', as: 'organization' });
    events.hasMany(models.sponsors, { foreignKey: 'event_id', as: 'event_sponsors' });
    events.hasMany(models.event_groups, { foreignKey: 'event_id' });
  };
  return events;
};