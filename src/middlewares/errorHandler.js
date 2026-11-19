// 統一錯誤處理：任何地方丟出錯誤，最後都會來這裡，回傳一致的格式
// Express 5 會自動把 async 函式裡的錯誤送到這裡，不用每支都寫 try/catch

// 找不到路由
exports.notFound = (req, res) => {
  res.status(404).json({ ok: false, message: `找不到 ${req.method} ${req.originalUrl}` });
};

// 其他錯誤
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    ok: false,
    message: status === 500 ? '伺服器發生錯誤' : err.message,
  });
};
