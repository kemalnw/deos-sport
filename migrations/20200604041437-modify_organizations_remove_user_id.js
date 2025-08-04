'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('organizations', 'user_id');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // await queryInterface.addColumn('users', 'organization_id', {
      //   type: Sequelize.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: 'users',
      //     key: 'id'
      //   }
      // });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
