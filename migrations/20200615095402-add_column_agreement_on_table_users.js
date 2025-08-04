'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('users', 'agreement', {
        type: Sequelize.INTEGER,
        after: 'event_referrer'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('users', 'agreement');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
