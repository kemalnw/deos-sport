'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('promotions', 'title',
      { type: Sequelize.STRING, after: 'id' });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('promotions', 'title');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
