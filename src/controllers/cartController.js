// Controller：購物車（路由已經先過 requireAuth，所以一定有 req.user）
const prisma = require('../config/prisma');
const httpError = require('../utils/httpError');
const { parsePositiveInt } = require('../utils/validators');

const PRODUCT_SELECT = { id: true, name: true, price: true, imageUrl: true, stock: true, isActive: true };

// 所有購物車 API 都回傳同一個格式，前端只要寫一種處理方式
async function getCartPayload(userId) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: PRODUCT_SELECT } },
    orderBy: { createdAt: 'asc' },
  });
  const items = rows.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    subtotal: r.quantity * r.product.price,
    product: r.product,
  }));
  return {
    items,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.subtotal, 0),
  };
}

async function findActiveProductOr404(productId) {
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw httpError(404, '商品不存在或已下架');
  return product;
}

const itemKey = (userId, productId) => ({ userId_productId: { userId, productId } });

// GET /api/cart
exports.get = async (req, res) => {
  res.json({ ok: true, ...(await getCartPayload(req.user.id)) });
};

// POST /api/cart  { productId, quantity = 1 }：重複加入 = 數量相加
exports.add = async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  const pid = parsePositiveInt(productId, 'productId');
  const qty = parsePositiveInt(quantity, 'quantity');
  const product = await findActiveProductOr404(pid);

  const existing = await prisma.cartItem.findUnique({ where: itemKey(req.user.id, pid) });
  const inCart = existing ? existing.quantity : 0;
  const newQty = inCart + qty;
  if (newQty > product.stock) {
    throw httpError(400, `庫存不足：此商品剩 ${product.stock} 件，購物車已有 ${inCart} 件`);
  }

  await prisma.cartItem.upsert({
    where: itemKey(req.user.id, pid),
    create: { userId: req.user.id, productId: pid, quantity: newQty },
    update: { quantity: newQty },
  });
  res.status(201).json({ ok: true, message: '已加入購物車', ...(await getCartPayload(req.user.id)) });
};

// PATCH /api/cart/:productId  { quantity }：直接設定成這個數量
exports.update = async (req, res) => {
  const pid = parsePositiveInt(req.params.productId, 'productId');
  const qty = parsePositiveInt((req.body || {}).quantity, 'quantity');

  const item = await prisma.cartItem.findUnique({ where: itemKey(req.user.id, pid) });
  if (!item) throw httpError(404, '購物車裡沒有這個商品');
  const product = await findActiveProductOr404(pid);
  if (qty > product.stock) throw httpError(400, `庫存不足：此商品剩 ${product.stock} 件`);

  await prisma.cartItem.update({ where: itemKey(req.user.id, pid), data: { quantity: qty } });
  res.json({ ok: true, ...(await getCartPayload(req.user.id)) });
};

// DELETE /api/cart/:productId
exports.remove = async (req, res) => {
  const pid = parsePositiveInt(req.params.productId, 'productId');
  const item = await prisma.cartItem.findUnique({ where: itemKey(req.user.id, pid) });
  if (!item) throw httpError(404, '購物車裡沒有這個商品');

  await prisma.cartItem.delete({ where: itemKey(req.user.id, pid) });
  res.json({ ok: true, ...(await getCartPayload(req.user.id)) });
};
