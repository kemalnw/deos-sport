'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoice_items', 'sponsor_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sponsors',
          key: 'id'
        },
        after: 'invoice_id'
      });
      await queryInterface.changeColumn('invoice_items', 'price', {
        type: Sequelize.INTEGER
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoice_items', 'sponsor_id');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
