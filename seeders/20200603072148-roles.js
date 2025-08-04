'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('roles', [
      {
        name: 'member',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'admin_company',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'admin_organization',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'superadmin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    return queryInterface.bulkDelete('roles', null, {});
  }
};
