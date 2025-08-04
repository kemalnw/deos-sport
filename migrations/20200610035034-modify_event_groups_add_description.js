'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('event_groups', 'description', { type: Sequelize.TEXT, after: "name" });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('event_groups', 'description');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
