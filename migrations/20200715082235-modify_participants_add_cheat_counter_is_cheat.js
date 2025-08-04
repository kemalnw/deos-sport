'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('participants', 'is_cheat', {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
        after: 'is_finish'
      });
      await queryInterface.addColumn('participants', 'cheat_counter', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        after: 'is_cheat'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('participants', 'is_cheat');
      await queryInterface.removeColumn('participants', 'cheat_counter');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
