'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'duration');
      await queryInterface.addColumn('participants', 'duration', { type: Sequelize.STRING, after: 'distance' });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'ranking');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
