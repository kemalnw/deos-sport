'use strict';
module.exports = (sequelize, DataTypes) => {
  const sponsors = sequelize.define('sponsors', {
    name: DataTypes.STRING,
    banner: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('banner');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    description: DataTypes.TEXT,
    type: DataTypes.INTEGER,
    event_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER
  }, {});
  sponsors.associate = function (models) {
    // associations can be defined here
    sponsors.belongsTo(models.events, { foreignKey: 'event_id' })
    sponsors.belongsTo(models.company, { foreignKey: 'company_id' })
    sponsors.hasMany(models.sponsor_items, { foreignKey: 'id' })
    sponsors.hasMany(models.carts, { foreignKey: 'sponsor_id' })
  };
  return sponsors;
};