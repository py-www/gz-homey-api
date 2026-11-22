// Controller：商品分類（給前端做篩選按鈕）
const prisma = require('../config/prisma');

// GET /api/categories
exports.list = async (req, res) => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { id: 'asc' },
  });
  res.json({ ok: true, categories });
};
