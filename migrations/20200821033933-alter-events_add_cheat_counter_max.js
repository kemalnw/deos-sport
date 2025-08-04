'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('events', 'cheat_counter_max', {
        type: Sequelize.INTEGER,
        defaultValue: 50,
        after: 'speed_limit'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('events', 'cheat_counter_max');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
