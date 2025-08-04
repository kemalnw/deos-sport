'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('companies', 'province_id', { type: Sequelize.CHAR, after: 'logo' });
      await queryInterface.addColumn('companies', 'regency_id', { type: Sequelize.CHAR, after: 'province_id' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('companies', 'province_id');
      await queryInterface.removeColumn('companies', 'regency_id');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
