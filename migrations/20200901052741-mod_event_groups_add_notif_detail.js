'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('event_groups', 'notif_detail', {
        type: Sequelize.JSON,
        after: 'notif_soon'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'notif_detail');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
