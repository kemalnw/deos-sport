'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('events', 'photo', { type: Sequelize.STRING, after: 'description' });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('events', 'photo');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
