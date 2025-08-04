'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'finished_at', { type: Sequelize.DATE, after: 'is_finish' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'finished_at');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
