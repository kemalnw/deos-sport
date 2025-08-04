'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'receipt_number', { type: Sequelize.STRING, after: 'proof_payment' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('invoices', 'receipt_number');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
