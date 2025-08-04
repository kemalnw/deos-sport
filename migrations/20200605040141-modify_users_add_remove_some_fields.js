'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // REMOVE Darah, medical record, hobby, domisili
      await queryInterface.removeColumn('users', 'domicile');
      await queryInterface.removeColumn('users', 'hobby');
      await queryInterface.removeColumn('users', 'blood_type');
      await queryInterface.removeColumn('users', 'medical_condition');

      // ADD province id, regency id
      await queryInterface.addColumn('users', 'province_id', { type: Sequelize.CHAR, after: 'nationality' });
      await queryInterface.addColumn('users', 'regency_id', { type: Sequelize.CHAR, after: 'province_id' });
      await queryInterface.addColumn('users', 'event_reason', { type: Sequelize.TEXT, after: 'address' });
      await queryInterface.addColumn('users', 'event_referrer', { type: Sequelize.TEXT, after: 'event_reason' });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // REMOVE Darah, medical record, hobby, domisili
      await queryInterface.addColumn('users', 'domicile', { type: Sequelize.STRING });
      await queryInterface.addColumn('users', 'hobby', { type: Sequelize.STRING });
      await queryInterface.addColumn('users', 'blood_type', { type: Sequelize.STRING });
      await queryInterface.addColumn('users', 'medical_condition', { type: Sequelize.STRING });

      // ADD province id, regency id
      await queryInterface.removeColumn('users', 'province_id');
      await queryInterface.removeColumn('users', 'regency_id');
      await queryInterface.removeColumn('users', 'event_reason');
      await queryInterface.removeColumn('users', 'event_referrer');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
