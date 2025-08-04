'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 0 = Exhibitor
      // 1 = Food Tenant
      // 2 = Sponsor (yang ada ijo2nya)
      await queryInterface.addColumn('sponsors', 'type', { type: Sequelize.INTEGER, after: 'description' });
      await queryInterface.removeColumn('sponsors', 'is_premium');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('sponsors', 'type');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
