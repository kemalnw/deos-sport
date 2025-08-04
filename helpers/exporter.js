const excel = require('exceljs');
// worksheetName: String
// column: Array
// data: Array
exports.exportExcel = (worksheetName, columns, data) => {
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet(worksheetName);

    worksheet.columns = columns;
    worksheet.addRows(data);

    return workbook;
};