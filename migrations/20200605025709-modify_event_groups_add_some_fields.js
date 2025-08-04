'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('event_groups', 'name', { type: Sequelize.STRING, after: 'id' });
      await queryInterface.addColumn('event_groups', 'max_quota', { type: Sequelize.INTEGER, after: 'end_time' });
      await queryInterface.addColumn('event_groups', 'remaining_quota', { type: Sequelize.INTEGER, after: 'max_quota' });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'name');
      await queryInterface.removeColumn('event_groups', 'max_quota');
      await queryInterface.removeColumn('event_groups', 'remaining_quota');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
