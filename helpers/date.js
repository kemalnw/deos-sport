const dayjs = require('dayjs');
// require('dayjs/locale/*');

exports.formatMysql = (date) => {
    dayjs.locale('id');
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

exports.formatDayMysql = (date) => {
    dayjs.locale('id');
    return dayjs(date).format('YYYY-MM-DD');
};

exports.formatBirthDate = (date) => {
    dayjs.locale('id');
    return dayjs(date).format('DD-MM-YYYY');
};