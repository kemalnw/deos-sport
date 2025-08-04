'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('users', 'company_id', {
        type: Sequelize.INTEGER,
        after: 'agora_id',
        allowNull: true
      });


      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('users', 'company_id');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
