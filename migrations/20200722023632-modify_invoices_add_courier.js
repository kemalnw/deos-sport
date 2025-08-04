'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'courier', {
        type: Sequelize.STRING,
        after: 'receipt_number'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'courier');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
