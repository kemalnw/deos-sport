'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'event_id', {
        type: Sequelize.INTEGER,
        after: 'user_id'
      });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'event_id');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
