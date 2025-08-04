'use strict';
module.exports = (sequelize, DataTypes) => {
  const company = sequelize.define('company', {
    name: DataTypes.STRING,
    pic: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    logo: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('logo');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    province_id: {
      type: DataTypes.CHAR,
      get() {
        return +this.getDataValue('province_id');
      }
    },
    regency_id: {
      type: DataTypes.CHAR,
      get() {
        return +this.getDataValue('regency_id');
      }
    },
    is_expedition: DataTypes.INTEGER,
    local_delivery_fee: DataTypes.INTEGER,
    bank_acc: DataTypes.STRING,
    bank_acc_no: DataTypes.STRING,
    bank_acc_name: DataTypes.STRING
  }, {});
  company.associate = function (models) {
    // associations can be defined here
    // company.hasMany(models.sponsors, { through: 'sponsors', foreignKey: 'company_id', as: 'company_sponsors' });
    // company.hasMany(models.promotions, { through: 'promotions', foreignKey: 'company_id', as: 'company_promotions' });
    company.belongsTo(models.provinces, { foreignKey: 'province_id' });
    company.belongsTo(models.regencies, { foreignKey: 'regency_id' });
    company.hasMany(models.sponsors, { foreignKey: 'company_id' });
    company.hasMany(models.promotions, { foreignKey: 'company_id' });
    company.hasMany(models.invoices, { foreignKey: 'company_id' });
  };
  return company;
};