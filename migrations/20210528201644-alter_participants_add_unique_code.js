'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try { 
      await queryInterface.addColumn('participants', 'nominal_unique', { type: Sequelize.INTEGER, defaultValue: 135000, after: 'approved_by' });
      await queryInterface.addColumn('participants', 'nominal_user_transfer', { type: Sequelize.INTEGER, defaultValue: 0, after: 'nominal_unique' });
      return Promise.resolve();
     }
     catch (e) {
       return Promise.reject(e);
     }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'nominal_unique');
      await queryInterface.removeColumn('participants', 'nominal_user_transfer');

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
