'use strict';
module.exports = (sequelize, DataTypes) => {
  const complaints = sequelize.define('complaints', {
    user_id: DataTypes.INTEGER,
    participant_id: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    photo: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('photo');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    status: DataTypes.INTEGER,
    distance: DataTypes.INTEGER,
    duration: DataTypes.STRING,
    is_approved: DataTypes.INTEGER,
  }, {});
  complaints.associate = function (models) {
    // associations can be defined here
    complaints.belongsTo(models.users, { foreignKey: 'user_id' });
    complaints.belongsTo(models.participants, { foreignKey: 'participant_id' });
  };
  return complaints;
};