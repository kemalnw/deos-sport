'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // U S E R S
      await queryInterface.addColumn('users', 'medical_condition', { type: Sequelize.TEXT, after: "point_reward" });
      await queryInterface.addColumn('users', 'blood_type', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'hobby', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'school_major', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'profession', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'path_photo', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'address', { type: Sequelize.TEXT, after: "point_reward" });
      await queryInterface.addColumn('users', 'domicile', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'nationality', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'gender', { type: Sequelize.STRING, after: "point_reward" });
      await queryInterface.addColumn('users', 'birth_date', { type: Sequelize.DATE, after: "point_reward" });


      // // P A R T I C I P A N T S
      await queryInterface.addColumn('participants', 'path_proof_of_payment', { type: Sequelize.STRING, after: "duration" });

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }


  },

  down: async (queryInterface, Sequelize) => {
    try {
      // U S E R S
      await queryInterface.removeColumn('users', 'birth_date');
      await queryInterface.removeColumn('users', 'gender');
      await queryInterface.removeColumn('users', 'nationality');
      await queryInterface.removeColumn('users', 'domicile');
      await queryInterface.removeColumn('users', 'address');
      await queryInterface.removeColumn('users', 'path_photo');
      await queryInterface.removeColumn('users', 'profession');
      await queryInterface.removeColumn('users', 'school_major');
      await queryInterface.removeColumn('users', 'hobby');
      await queryInterface.removeColumn('users', 'blood_type');
      await queryInterface.removeColumn('users', 'medical_condition');

      // P A R T I C I P A N T S
      await queryInterface.removeColumn('participants', 'path_proof_of_payment');

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
