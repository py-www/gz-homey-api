// 測試共用工具：建立帶 TAG 前綴的測試資料，結束後用 cleanup() 全部刪掉
require('dotenv').config();
// 測試會新增 / 刪除資料，只能連測試用的資料庫（Neon 的 test branch），不能碰線上那個
// 比 Neon 的 endpoint（主機名稱第一段，去掉 -pooler）：pooled 和 direct 字串不同，但其實是同一個資料庫
const neonEndpoint = (url) => {
  try {
    return new URL(url).hostname.split('.')[0].replace(/-pooler$/, '');
  } catch {
    return url;
  }
};
const testEndpoint = process.env.TEST_DATABASE_URL && neonEndpoint(process.env.TEST_DATABASE_URL);
const liveEndpoints = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean).map(neonEndpoint);
if (!testEndpoint || liveEndpoints.includes(testEndpoint)) {
  throw new Error('請在 .env 設定 TEST_DATABASE_URL（Neon test branch 的連線字串），不能指向 DATABASE_URL / DIRECT_URL 那個資料庫');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // 一定要在 require prisma 之前
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

// 每次跑測試都不一樣的前綴，例如 tm3k2x9ab1c
const TAG = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let seq = 0;

async function createUser(role = 'USER') {
  seq += 1;
  const user = await prisma.user.create({
    data: { email: `${TAG}-${seq}@test.local`, password: 'not-used', name: '測試帳號', role },
  });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}

async function createCategory() {
  seq += 1;
  return prisma.category.create({ data: { name: `${TAG}-分類${seq}`, slug: `${TAG}-cat${seq}` } });
}

async function createProduct(categoryId, overrides = {}) {
  seq += 1;
  const { name, ...rest } = overrides;
  return prisma.product.create({
    data: {
      description: '測試用商品',
      price: 500,
      stock: 5,
      imageUrl: 'https://picsum.photos/seed/test/600/600',
      categoryId,
      ...rest,
      name: `${TAG}-${name || `商品${seq}`}`, // 一定帶 TAG，cleanup 才刪得到
    },
  });
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG } } }); // 購物車會跟著 Cascade 刪除
  await prisma.product.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: TAG } } });
  await prisma.$disconnect();
}

module.exports = { app, request, prisma, TAG, createUser, createCategory, createProduct, cleanup };
