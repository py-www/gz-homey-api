const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, TAG, createCategory, createProduct, cleanup } = require('./helpers');

let cat;
let hidden;

before(async () => {
  cat = await createCategory();
  for (let i = 1; i <= 10; i += 1) await createProduct(cat.id, { name: `一般商品${i}` });
  await createProduct(cat.id, { name: '特別款香氛', description: '獨一無二' });
  hidden = await createProduct(cat.id, { name: '已下架', isActive: false });
});
after(cleanup);

test('GET /api/categories 回傳分類陣列', async () => {
  const res = await request(app).get('/api/categories');
  assert.equal(res.status, 200);
  assert.ok(res.body.categories.some((c) => c.slug === cat.slug));
});

test('分類篩選 + 分頁：11 件上架商品，每頁 4 件 → 第 3 頁剩 3 件', async () => {
  const res = await request(app).get(`/api/products?category=${cat.slug}&limit=4&page=3`);
  assert.equal(res.status, 200);
  assert.equal(res.body.products.length, 3);
  assert.deepEqual(res.body.pagination, { page: 3, limit: 4, total: 11, totalPages: 3 });
  assert.ok(res.body.products.every((p) => p.category.slug === cat.slug));
});

test('列表不包含已下架商品', async () => {
  const res = await request(app).get(`/api/products?category=${cat.slug}&limit=50`);
  assert.ok(!res.body.products.some((p) => p.id === hidden.id));
});

test('關鍵字搜尋（名稱，不分大小寫）', async () => {
  const res = await request(app).get(`/api/products?q=${encodeURIComponent(`${TAG}-特別款`)}`);
  assert.equal(res.body.products.length, 1);
  assert.equal(res.body.products[0].name, `${TAG}-特別款香氛`);
});

test('page 不是正整數 → 400', async () => {
  const res = await request(app).get('/api/products?page=abc');
  assert.equal(res.status, 400);
});

test('GET /api/products/:id 成功', async () => {
  const list = await request(app).get(`/api/products?category=${cat.slug}&limit=1`);
  const id = list.body.products[0].id;
  const res = await request(app).get(`/api/products/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.product.id, id);
  assert.ok(res.body.product.category);
});

test('GET 下架商品 → 404；不存在 → 404；id 亂打 → 400', async () => {
  assert.equal((await request(app).get(`/api/products/${hidden.id}`)).status, 404);
  assert.equal((await request(app).get('/api/products/99999999')).status, 404);
  assert.equal((await request(app).get('/api/products/abc')).status, 400);
});
