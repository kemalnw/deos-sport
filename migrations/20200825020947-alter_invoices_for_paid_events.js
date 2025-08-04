'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'payment_for', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        after: 'invoice_no'
      });
      await queryInterface.addColumn('invoices', 'res_doku_redirect', {
        type: Sequelize.JSON,
        after: 'company_id'
      });
      await queryInterface.addColumn('invoices', 'res_doku_notify', {
        type: Sequelize.JSON,
        after: 'company_id'
      });
      await queryInterface.addColumn('invoices', 'req_doku_receive', {
        type: Sequelize.JSON,
        after: 'company_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'payment_for');
      await queryInterface.removeColumn('invoices', 'res_doku_redirect');
      await queryInterface.removeColumn('invoices', 'res_doku_notify');
      await queryInterface.removeColumn('invoices', 'req_doku_receive');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
