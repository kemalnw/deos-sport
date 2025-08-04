'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('event_groups', 'warning', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'end_time'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'warning');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};