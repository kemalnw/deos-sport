'use strict';
module.exports = (sequelize, DataTypes) => {
  const sponsor_items = sequelize.define('sponsor_items', {
    sponsor_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    weight: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    image: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('image');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    }
  }, {});
  sponsor_items.associate = function(models) {
    // associations can be defined here
    sponsor_items.belongsTo(models.sponsors, { foreignKey: 'sponsor_id'})
  };
  return sponsor_items;
};