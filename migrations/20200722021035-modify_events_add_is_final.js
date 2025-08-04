'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('events', 'is_final', {
        type: Sequelize.BOOLEAN,
        after: 'duration',
        defaultValue: 0
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('events', 'is_final');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
