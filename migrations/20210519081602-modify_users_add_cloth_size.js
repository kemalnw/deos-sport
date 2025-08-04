'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     try {
        await queryInterface.addColumn('users', 'cloth_size', { type: Sequelize.STRING, allowNull: true });
        await queryInterface.addColumn('users', 'cloth_width', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('users', 'cloth_length', { type: Sequelize.INTEGER, allowNull: true });

        return Promise.resolve();
      }
      catch (e) {
        return Promise.reject(e);
      }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
      try {
        await queryInterface.removeColumn('users', 'cloth_size');
        await queryInterface.removeColumn('users', 'cloth_width');
        await queryInterface.removeColumn('users', 'cloth_length');
        return Promise.resolve();
      }
      catch (e) {
        return Promise.reject(e);
      }
  }
};
