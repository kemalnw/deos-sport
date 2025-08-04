'use strict';
module.exports = (sequelize, DataTypes) => {
  const participants = sequelize.define('participants', {
    participant_no: DataTypes.STRING,
    ranking: DataTypes.INTEGER,
    payment_status: DataTypes.INTEGER,
    distance: DataTypes.INTEGER,
    duration: DataTypes.STRING,
    duration_virtual: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.duration) {
          const durations = this.duration.split(':');
          const minute = +durations[0];
          const second = durations[1] ? +durations[1] : 0;
          return (minute * 60) + second;
        }
        return 0;
      },
      set(value) {
        throw new Error('Do not try to set the `duration_virtual` value!');
      }
    },
    pace: DataTypes.STRING,
    path_proof_of_payment: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('path_proof_of_payment');
        return {
          path: rawValue,
          url: rawValue ? process.env.AWS_URL + rawValue : null
        }
      }
    },
    is_finish: DataTypes.INTEGER,
    is_cheat: DataTypes.INTEGER,
    cheat_counter: DataTypes.INTEGER,
    finished_at: DataTypes.DATE,
    user_id: DataTypes.INTEGER,
    event_id: DataTypes.INTEGER,
    event_group_id: DataTypes.INTEGER,
    is_complaint: DataTypes.INTEGER,
    sender_name: DataTypes.STRING,
    sender_bank: DataTypes.STRING,
    sender_rekening: DataTypes.STRING,
    approved_by: {
      type: DataTypes.INTEGER,
      get() {
        const approvedBy = this.getDataValue('approved_by');
        return approvedBy ? approvedBy : null
      }
    },
    nominal_unique: DataTypes.INTEGER,
    nominal_user_transfer: DataTypes.INTEGER,
    will_buy_merchandise: DataTypes.INTEGER
  }, {});
  participants.associate = function (models) {
    // associations can be defined here
    participants.belongsTo(models.users, { foreignKey: 'user_id' });
    participants.belongsTo(models.events, { foreignKey: 'event_id' });
    participants.belongsTo(models.event_groups, { foreignKey: 'event_group_id' });
    // participants.belongsTo(models.users, { foreignKey: 'approved_by', onDelete: 'CASCADE'});
    participants.belongsTo(models.users, { as: 'admin_approved', foreignKey: 'approved_by',  targetKey: 'id', allowNull: true});
    participants.hasMany(models.participant_routes, { foreignKey: 'participant_id' })
  };
  return participants;
};