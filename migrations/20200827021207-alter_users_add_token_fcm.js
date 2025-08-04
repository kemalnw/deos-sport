'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('users', 'token_fcm', {
        type: Sequelize.TEXT,
        after: 'organization_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('users', 'token_fcm');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};