'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'res_doku_identify', {
        type: Sequelize.JSON,
        after: 'res_doku_redirect'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'res_doku_identify');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
