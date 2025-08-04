'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'ranking', { type: Sequelize.INTEGER, after: 'participant_no' });

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
