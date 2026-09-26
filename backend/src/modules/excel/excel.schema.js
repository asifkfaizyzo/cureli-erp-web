// backend/src/modules/excel/excel.schema.js (do not remove this comment)
const Joi = require('joi');

const convertExcelValidation = {
  body: Joi.object({
    // No body params for file upload
  }),
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string()
      .pattern(/\.(xls|xlsx)$/i)
      .required()
      .messages({
        'string.pattern.base': 'File must be .xls or .xlsx format',
      }),
    encoding: Joi.string(),
    mimetype: Joi.string()
      .valid(
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .required(),
    size: Joi.number()
      .max(10 * 1024 * 1024)
      .required()
      .messages({
        'number.max': 'File size must not exceed 10MB',
      }),
    buffer: Joi.binary().required(),
  }),
};

module.exports = {
  convertExcelValidation,
};