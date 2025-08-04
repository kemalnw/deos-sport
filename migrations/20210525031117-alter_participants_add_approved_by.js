'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'approved_by', {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        } });
      return Promise.resolve();
     }
     catch (e) {
       return Promise.reject(e);
     }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'approved_by');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
