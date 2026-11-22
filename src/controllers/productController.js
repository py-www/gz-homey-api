// Controller：公開商品（所有人都能看，只顯示上架中的商品）
const prisma = require('../config/prisma');
const httpError = require('../utils/httpError');
const { parsePositiveInt } = require('../utils/validators');

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

// GET /api/products?page=1&limit=8&category=candles&q=木
exports.list = async (req, res) => {
  const page = req.query.page ? parsePositiveInt(req.query.page, 'page') : 1;
  const limit = Math.min(req.query.limit ? parsePositiveInt(req.query.limit, 'limit') : DEFAULT_LIMIT, MAX_LIMIT);
  const category = req.query.category ? String(req.query.category) : '';
  const q = req.query.q ? String(req.query.q).trim() : '';

  const where = { isActive: true };
  if (category) where.category = { slug: category };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  // 同時查「總數」和「這一頁的資料」
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    ok: true,
    products,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
};

// GET /api/products/:id
exports.detail = async (req, res) => {
  const id = parsePositiveInt(req.params.id, '商品 id');
  const product = await prisma.product.findFirst({ where: { id, isActive: true }, include: { category: true } });
  if (!product) throw httpError(404, '找不到這個商品');
  res.json({ ok: true, product });
};
