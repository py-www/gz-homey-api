// 測試共用工具：建立帶 TAG 前綴的測試資料，結束後用 cleanup() 全部刪掉
require('dotenv').config();
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
