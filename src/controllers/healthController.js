// Controller（C）：處理「收到請求後要做什麼」，再回傳結果
const prisma = require('../config/prisma');

// GET /api/health：確認伺服器活著
exports.getHealth = (req, res) => {
  res.json({ ok: true, message: 'GZ HOMEY API is running' });
};

// GET /api/health/db：確認資料庫連得上
exports.getDbHealth = async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, database: 'connected' });
};
