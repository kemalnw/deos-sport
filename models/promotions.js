'use strict';
module.exports = (sequelize, DataTypes) => {
  const promotions = sequelize.define('promotions', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
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
    company_id: DataTypes.INTEGER
  }, {});
  promotions.associate = function (models) {
    // associations can be defined here
    promotions.belongsTo(models.company, { foreignKey: 'company_id' });
  };
  return promotions;
};