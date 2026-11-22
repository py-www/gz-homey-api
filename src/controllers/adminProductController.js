// Controller：管理員商品管理（新增 / 編輯 / 刪除）。路由已經先過 requireAuth + requireAdmin
const prisma = require('../config/prisma');
const httpError = require('../utils/httpError');
const { parsePositiveInt } = require('../utils/validators');

const REQUIRED = ['name', 'description', 'price', 'imageUrl', 'categoryId'];
const URL_RE = /^https?:\/\/\S+$/;

const isNonEmptyString = (v, max) => typeof v === 'string' && v.trim().length > 0 && (!max || v.length <= max);
const isNonNegativeInt = (v) => Number.isInteger(v) && v >= 0;

// 把 body 轉成 Prisma 要的 data；partial=true 代表編輯（欄位可以只給一部分）
function buildProductData(body, { partial }) {
  const b = body || {};
  const has = (k) => b[k] !== undefined;
  const data = {};

  if (!partial) {
    const missing = REQUIRED.filter((k) => !has(k));
    if (missing.length) throw httpError(400, `缺少必填欄位：${missing.join(', ')}`);
  }

  if (has('name')) {
    if (!isNonEmptyString(b.name, 100)) throw httpError(400, 'name 必填，最多 100 字');
    data.name = b.name.trim();
  }
  if (has('nameEn')) {
    if (b.nameEn !== null && !(typeof b.nameEn === 'string' && b.nameEn.length <= 100)) throw httpError(400, 'nameEn 最多 100 字');
    data.nameEn = b.nameEn;
  }
  if (has('description')) {
    if (!isNonEmptyString(b.description)) throw httpError(400, 'description 必填');
    data.description = b.description.trim();
  }
  if (has('price')) {
    if (!isNonNegativeInt(b.price)) throw httpError(400, 'price 必須是 0 以上的整數');
    data.price = b.price;
  }
  if (has('stock')) {
    if (!isNonNegativeInt(b.stock)) throw httpError(400, 'stock 必須是 0 以上的整數');
    data.stock = b.stock;
  }
  if (has('imageUrl')) {
    if (typeof b.imageUrl !== 'string' || !URL_RE.test(b.imageUrl)) throw httpError(400, 'imageUrl 必須是 http(s) 網址');
    data.imageUrl = b.imageUrl;
  }
  if (has('affiliateUrl')) {
    if (b.affiliateUrl !== null && !(typeof b.affiliateUrl === 'string' && URL_RE.test(b.affiliateUrl))) {
      throw httpError(400, 'affiliateUrl 必須是 http(s) 網址或 null');
    }
    data.affiliateUrl = b.affiliateUrl;
  }
  if (has('isActive')) {
    if (typeof b.isActive !== 'boolean') throw httpError(400, 'isActive 必須是 true 或 false');
    data.isActive = b.isActive;
  }
  if (has('categoryId')) data.categoryId = parsePositiveInt(b.categoryId, 'categoryId');

  if (partial && Object.keys(data).length === 0) throw httpError(400, '沒有要更新的欄位');
  return data;
}

async function assertCategoryExists(categoryId) {
  if (categoryId === undefined) return;
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw httpError(400, 'categoryId 不存在');
}

async function findProductOr404(id) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw httpError(404, '找不到這個商品');
  return product;
}

// POST /api/admin/products
exports.create = async (req, res) => {
  const data = buildProductData(req.body, { partial: false });
  await assertCategoryExists(data.categoryId);
  const product = await prisma.product.create({ data, include: { category: true } });
  res.status(201).json({ ok: true, product });
};

// PUT /api/admin/products/:id（部分更新）
exports.update = async (req, res) => {
  const id = parsePositiveInt(req.params.id, '商品 id');
  await findProductOr404(id);
  const data = buildProductData(req.body, { partial: true });
  await assertCategoryExists(data.categoryId);
  const product = await prisma.product.update({ where: { id }, data, include: { category: true } });
  res.json({ ok: true, product });
};

// DELETE /api/admin/products/:id（購物車裡的這個商品會跟著 Cascade 刪除）
exports.remove = async (req, res) => {
  const id = parsePositiveInt(req.params.id, '商品 id');
  await findProductOr404(id);
  await prisma.product.delete({ where: { id } });
  res.json({ ok: true, message: '商品已刪除' });
};
