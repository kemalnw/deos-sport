'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try { 
      await queryInterface.addColumn('participants', 'will_buy_merchandise', { 
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        after: 'nominal_user_transfer'
      });
      return Promise.resolve();
     }
     catch (e) {
       return Promise.reject(e);
     }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'will_buy_merchandise');

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
