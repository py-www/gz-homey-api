// Middleware（門口檢查站）：驗證 JWT token、檢查是不是管理員
const jwt = require('jsonwebtoken');
const httpError = require('../utils/httpError');

// 必須登入：從 Header 拿 token → 驗證 → 把使用者資料放進 req.user
exports.requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''; // 格式：Bearer xxxxx
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) throw httpError(401, '請先登入');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // 驗證簽章 + 有沒有過期
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    throw httpError(401, 'Token 無效或已過期，請重新登入');
  }
};

// 必須是管理員：要放在 requireAuth 後面
exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') throw httpError(403, '需要管理員權限');
  next();
};
