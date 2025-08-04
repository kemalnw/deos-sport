'use strict';
module.exports = (sequelize, DataTypes) => {
  const carts = sequelize.define('carts', {
    name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    total: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.price * this.qty;
      },
    },
    user_id: DataTypes.INTEGER,
    sponsor_item_id: DataTypes.INTEGER,
    sponsor_id: DataTypes.INTEGER
  }, {});
  carts.associate = function(models) {
    carts.belongsTo(models.users, { foreignKey: 'user_id' });
    carts.belongsTo(models.sponsor_items, { foreignKey: 'sponsor_item_id' });
    carts.belongsTo(models.sponsors, { foreignKey: 'sponsor_id' });
    // associations can be defined here
  };
  return carts;
};