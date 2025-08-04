'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('regencies', {
      city_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      province_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      province: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      city_name: {
        type: Sequelize.STRING
      },
      postal_code: {
        type: Sequelize.STRING
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('regencies');
  }
};
