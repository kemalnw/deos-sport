'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try { 
      // distance, time , is_approved 
      await queryInterface.addColumn('complaints', 'distance', { type: Sequelize.INTEGER, defaultValue: 0, after: 'status'  });
      await queryInterface.addColumn('complaints', 'duration', { type: Sequelize.STRING,  defaultValue: '00:00', after: 'distance'  });
      await queryInterface.addColumn('complaints', 'is_approved', { type: Sequelize.INTEGER, defaultValue: 0, after: 'duration'  });
      return Promise.resolve();
     }
     catch (e) {
       return Promise.reject(e);
     }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('complaints', 'distance');
      await queryInterface.removeColumn('complaints', 'duration');
      await queryInterface.removeColumn('complaints', 'is_approved');

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
