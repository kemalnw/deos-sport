'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'join_payload', {
        type: Sequelize.JSON,
        after: 'company_id'
      });
      await queryInterface.addColumn('invoices', 'participant_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'participants',
          key: 'id'
        },
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
      await queryInterface.removeColumn('invoices', 'join_payload');
      await queryInterface.removeColumn('invoices', 'participant_id');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
