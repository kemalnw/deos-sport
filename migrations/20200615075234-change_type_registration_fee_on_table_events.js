'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('events', 'registration_fee', {
        type: Sequelize.INTEGER
      });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: (queryInterface, Sequelize) => {
    try {
      // NOTHING
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
