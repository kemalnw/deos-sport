'use strict';
module.exports = (sequelize, DataTypes) => {
  const invoice_items = sequelize.define('invoice_items', {
    name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    invoice_id: DataTypes.INTEGER,
    sponsor_id: DataTypes.INTEGER,
    sponsor_item_id: DataTypes.INTEGER
  }, {});
  invoice_items.associate = function (models) {
    // associations can be defined here
    invoice_items.belongsTo(models.invoices, { foreignKey: 'invoice_id' });
    invoice_items.belongsTo(models.sponsor_items, { foreignKey: 'sponsor_item_id' })
    invoice_items.belongsTo(models.sponsors, { foreignKey: 'sponsor_id' })
  };
  return invoice_items;
};