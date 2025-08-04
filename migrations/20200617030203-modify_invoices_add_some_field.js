'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'delivery_name', { type: Sequelize.STRING, after: 'invoice_no' });
      await queryInterface.addColumn('invoices', 'delivery_phone', { type: Sequelize.STRING, after: 'delivery_name' });
      await queryInterface.addColumn('invoices', 'delivery_address', { type: Sequelize.TEXT, after: 'delivery_phone' });
      await queryInterface.addColumn('invoices', 'delivery_fee', { type: Sequelize.INTEGER, after: 'delivery_address' });
      await queryInterface.addColumn('invoices', 'sub_total', { type: Sequelize.INTEGER, after: 'delivery_fee' });
      await queryInterface.changeColumn('invoices', 'total_price', {
        type: Sequelize.INTEGER
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'delivery_name');
      await queryInterface.removeColumn('invoices', 'delivery_phone');
      await queryInterface.removeColumn('invoices', 'delivery_address');
      await queryInterface.removeColumn('invoices', 'delivery_fee');
      await queryInterface.removeColumn('invoices', 'sub_total');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
