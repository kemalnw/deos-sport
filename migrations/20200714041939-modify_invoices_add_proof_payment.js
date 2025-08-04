'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'proof_payment', { type: Sequelize.STRING, after: 'status' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('invoices', 'proof_payment');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
