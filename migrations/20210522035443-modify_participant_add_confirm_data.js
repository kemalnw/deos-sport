'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
     await queryInterface.addColumn('participants', 'sender_name', { type: Sequelize.STRING });
     await queryInterface.addColumn('participants', 'sender_bank', { type: Sequelize.STRING });
     await queryInterface.addColumn('participants', 'sender_rekening', { type: Sequelize.STRING });
     return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'sender_name');
      await queryInterface.removeColumn('participants', 'sender_bank');
      await queryInterface.removeColumn('participants', 'sender_rekening');

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
