// 共用的輸入驗證：不合法就丟 400，由 errorHandler 回傳
const httpError = require('./httpError');

// 正整數 1, 2, 3…：接受數字或數字字串；0、負數、小數、"abc"、true 都會 400
exports.parsePositiveInt = (value, fieldName) => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(n) || n <= 0) throw httpError(400, `${fieldName} 必須是正整數`);
  return n;
};
