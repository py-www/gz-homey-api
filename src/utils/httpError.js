// 建立「有狀態碼的錯誤」：throw httpError(400, '訊息') → errorHandler 會回傳對應的狀態碼
module.exports = function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
};
