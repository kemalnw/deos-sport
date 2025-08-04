'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('sponsors', 'is_premium', {
        type: Sequelize.BOOLEAN,
        after: 'description',
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
      await queryInterface.removeColumn('sponsors', 'is_premium');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
