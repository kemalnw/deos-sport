'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'pace', {
        type: Sequelize.STRING,
        after: 'duration'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'pace');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
