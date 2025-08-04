'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('companies', 'bank_acc_name', {
        type: Sequelize.STRING,
        after: 'regency_id'
      });
      await queryInterface.addColumn('companies', 'bank_acc_no', {
        type: Sequelize.STRING,
        after: 'regency_id'
      });
      await queryInterface.addColumn('companies', 'bank_acc', {
        type: Sequelize.STRING,
        after: 'regency_id'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('companies', 'bank_acc_name');
      await queryInterface.removeColumn('companies', 'bank_acc_no');
      await queryInterface.removeColumn('companies', 'bank_acc');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
