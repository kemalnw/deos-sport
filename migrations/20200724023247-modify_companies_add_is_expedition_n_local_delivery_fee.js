'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('companies', 'local_delivery_fee', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        after: 'regency_id'
      });
      await queryInterface.addColumn('companies', 'is_expedition', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'regency_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('companies', 'local_delivery_fee');
      await queryInterface.removeColumn('companies', 'is_expedition');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
