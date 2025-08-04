'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 0 = Mass
      // 1 = Individual
      await queryInterface.addColumn('event_groups', 'type', { type: Sequelize.BOOLEAN, after: 'remaining_quota' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'type');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
