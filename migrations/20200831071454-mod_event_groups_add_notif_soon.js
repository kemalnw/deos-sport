'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('event_groups', 'notif_soon', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'event_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'notif_soon');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
