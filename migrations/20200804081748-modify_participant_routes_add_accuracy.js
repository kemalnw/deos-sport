'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participant_routes', 'accuracy', {
        type: Sequelize.DOUBLE(11, 2),
        defaultValue: 0,
        after: 'participant_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participant_routes', 'accuracy');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
