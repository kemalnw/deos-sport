'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('sponsor_items', 'sponsor_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sponsors',
          key: 'id'
        },
        after: 'id'
      });
      await queryInterface.addColumn('sponsor_items', 'price', {
        type: Sequelize.INTEGER,
        after: 'name'
      });
      await queryInterface.addColumn('sponsor_items', 'description', {
        type: Sequelize.TEXT,
        after: 'price'
      });
      await queryInterface.addColumn('sponsor_items', 'image', {
        type: Sequelize.STRING,
        after: 'description'
      });
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('sponsor_items', 'price');
      await queryInterface.removeColumn('sponsor_items', 'description');
      await queryInterface.removeColumn('sponsor_items', 'image');
      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
