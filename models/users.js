'use strict';
module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    name: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    point_reward: DataTypes.INTEGER,
    // ........................... //
    birth_date: DataTypes.DATE,
    gender: DataTypes.STRING,
    nationality: DataTypes.STRING,
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
    address: DataTypes.TEXT,
    event_reason: DataTypes.TEXT,
    event_referrer: DataTypes.TEXT,
    agreement: {
      type: DataTypes.INTEGER,
      get() {
        const rawValue = this.getDataValue('agreement');
        if (rawValue) return "Ya";
        return "Tidak";
      }
    },
    path_photo: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('path_photo');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    profession: DataTypes.STRING,
    school_major: DataTypes.STRING,
    // ........................... //
    facebook_id: DataTypes.STRING,
    google_id: DataTypes.STRING,
    agora_id: DataTypes.STRING,
    organization_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,
    token_fcm: DataTypes.TEXT,
    cloth_size: DataTypes.STRING,
    cloth_width: DataTypes.INTEGER,
    cloth_length: DataTypes.INTEGER
  },
    {
      // hooks: {
      //   beforeValidate: function (users, option) {
      //     const salt = bcrypt.genSaltSync(10);
      //     let password = users.password;
      //     if (!password) {
      //       var randomstring = Math.random().toString(36).slice(-8);

      //       const year = users.birth_date.getFullYear();
      //       const day = users.birth_date.getDate();

      //       let month = `${users.birth_date.getMonth() + 1}`;
      //       if (month.length === 1) {
      //         month = `0${month}`
      //       }

      //       password = `${year}-${month}-${day}`;
      //     }

      //     users.password = bcrypt.hashSync(password, salt);
      //   }
      // },
      // defaultScope: {
      //   attributes: { exclude: ['password'] }
      // }
    });
  users.associate = function (models) {
    // associations can be defined here
    users.belongsTo(models.provinces, { foreignKey: 'province_id' });
    users.belongsTo(models.regencies, { foreignKey: 'regency_id' });
    users.belongsTo(models.roles, { foreignKey: 'role_id', as: 'role' });
    users.belongsTo(models.organizations, { foreignKey: 'organization_id', as: 'organization' });
    users.belongsTo(models.company, { foreignKey: 'company_id', as: 'company' });
    // users.belongsToMany(models.invoices, { through: 'invoices',  targetKey: 'user_id', as: 'user_invoices' });
  };
  return users;
};