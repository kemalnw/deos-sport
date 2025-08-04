'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('companies', 'logo', {
        type: Sequelize.STRING,
        after: 'email'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('companies', 'logo');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
