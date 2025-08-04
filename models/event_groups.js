'use strict';
const dayjs = require('dayjs');
const tzOffset = require("tz-offset");
tzOffset.offsetOf("Asia/Jakarta");
module.exports = (sequelize, DataTypes) => {
  const event_groups = sequelize.define('event_groups', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    start_time: {
      type: DataTypes.DATE,
      get() {
        const startTime = this.getDataValue('start_time');
        return dayjs(startTime).format('YYYY-MM-DD HH:mm:ss');
      }
    },
    end_time: {
      type: DataTypes.DATE,
      get() {
        const endTime = this.getDataValue('end_time');
        return dayjs(endTime).format('YYYY-MM-DD HH:mm:ss');
      }
    },
    max_quota: DataTypes.INTEGER,
    remaining_quota: DataTypes.INTEGER,
    type: DataTypes.INTEGER,
    event_id: DataTypes.INTEGER,
    warning: DataTypes.INTEGER,
    notif_soon: DataTypes.INTEGER,
    notif_detail: DataTypes.JSON
  }, {});
  event_groups.associate = function (models) {
    // associations can be defined here
    event_groups.belongsTo(models.events, { foreignKey: 'event_id' });
    event_groups.hasMany(models.participants, { foreignKey: 'event_group_id' });
  };
  return event_groups;
};