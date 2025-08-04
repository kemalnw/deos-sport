'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('events', 'type', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'description'
      });

      await queryInterface.addColumn('events', 'speed_limit', {
        type: Sequelize.INTEGER,
        after: 'type'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('events', 'type');
      await queryInterface.removeColumn('events', 'speed_limit');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
