'use strict';
module.exports = (sequelize, DataTypes) => {
  const invoices = sequelize.define('invoices', {
    invoice_no: DataTypes.STRING,
    payment_for: DataTypes.INTEGER,
    delivery_name: DataTypes.STRING,
    delivery_phone: DataTypes.STRING,
    delivery_address: DataTypes.TEXT,
    delivery_fee: DataTypes.INTEGER,
    sub_total: DataTypes.INTEGER,
    total_price: DataTypes.INTEGER,
    status: DataTypes.BOOLEAN,
    proof_payment: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('proof_payment');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    receipt_number: DataTypes.STRING,
    courier: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,
    participant_id: DataTypes.INTEGER,
    join_payload: DataTypes.JSON,
    req_doku_receive: DataTypes.JSON,
    res_doku_notify: DataTypes.JSON,
    res_doku_redirect: DataTypes.JSON,
    res_doku_identify: DataTypes.JSON,
    doku_payment_code: DataTypes.STRING,
    doku_payment_bank: DataTypes.STRING,
    gateway_reference_id: DataTypes.STRING,
    gateway_req_payload: DataTypes.JSON,
    gateway_res_payload: DataTypes.JSON
  }, {});
  invoices.associate = function (models) {
    // associations can be defined here
    invoices.belongsTo(models.company, { foreignKey: 'company_id' });
    invoices.belongsTo(models.users, { foreignKey: 'user_id' });
    invoices.hasMany(models.invoice_items, { foreignKey: 'invoice_id' });
  };
  return invoices;
};