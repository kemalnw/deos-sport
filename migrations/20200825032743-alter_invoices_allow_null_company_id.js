'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('invoices', 'company_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // NOTHING
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};