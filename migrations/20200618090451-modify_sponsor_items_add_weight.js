'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('sponsor_items', 'weight', { type: Sequelize.INTEGER, after: 'name' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('sponsor_items', 'weight');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
