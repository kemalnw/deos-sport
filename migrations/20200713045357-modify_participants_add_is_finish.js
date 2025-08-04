'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'is_finish', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'path_proof_of_payment'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'is_finish');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
