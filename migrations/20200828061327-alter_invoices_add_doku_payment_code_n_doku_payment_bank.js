'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'doku_payment_bank', {
        type: Sequelize.STRING,
        after: 'join_payload'
      });
      await queryInterface.addColumn('invoices', 'doku_payment_code', {
        type: Sequelize.STRING,
        after: 'join_payload'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'doku_payment_bank');
      await queryInterface.removeColumn('invoices', 'doku_payment_code');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};