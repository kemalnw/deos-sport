'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'is_complaint', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'cheat_counter'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'is_complaint');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
