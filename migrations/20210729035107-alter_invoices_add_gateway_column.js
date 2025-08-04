'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('invoices', 'gateway_reference_id', { type: Sequelize.STRING, allowNull: true, defaultValue: null, after: 'res_doku_identify' });
      await queryInterface.addColumn('invoices', 'gateway_req_payload', { type: Sequelize.JSON, allowNull: true, defaultValue: null, after: 'gateway_reference_id' });
      await queryInterface.addColumn('invoices', 'gateway_res_payload', { type: Sequelize.JSON, allowNull: true, defaultValue: null, after: 'gateway_req_payload' });

      await queryInterface.addIndex('invoices', ['gateway_reference_id'], { name: 'gateway_reference_id_idx' });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('invoices', 'gateway_reference_id');
      await queryInterface.removeColumn('invoices', 'gateway_req_payload');
      await queryInterface.removeColumn('invoices', 'gateway_res_payload');

      return Promise.resolve();
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
};
