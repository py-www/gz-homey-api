const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, TAG, createUser, createCategory, createProduct, cleanup } = require('./helpers');

let admin;
let member;
let cat;

before(async () => {
  admin = await createUser('ADMIN');
  member = await createUser('USER');
  cat = await createCategory();
});
after(cleanup);

const validBody = () => ({
  name: `${TAG}-管理員新增`,
  description: '管理員建立的商品',
  price: 880,
  stock: 10,
  imageUrl: 'https://picsum.photos/seed/admin/600/600',
  categoryId: cat.id,
});

test('沒帶 token 新增 → 401', async () => {
  const res = await request(app).post('/api/admin/products').send(validBody());
  assert.equal(res.status, 401);
});

test('一般會員新增 → 403', async () => {
  const res = await request(app).post('/api/admin/products').set('Authorization', `Bearer ${member.token}`).send(validBody());
  assert.equal(res.status, 403);
});

test('管理員新增 → 201', async () => {
  const res = await request(app).post('/api/admin/products').set('Authorization', `Bearer ${admin.token}`).send(validBody());
  assert.equal(res.status, 201);
  assert.equal(res.body.product.price, 880);
  assert.equal(res.body.product.category.id, cat.id);
});

test('新增缺欄位 / price 負數 / categoryId 不存在 → 400', async () => {
  const auth = { Authorization: `Bearer ${admin.token}` };
  const { name, ...noName } = validBody();
  assert.equal((await request(app).post('/api/admin/products').set(auth).send(noName)).status, 400);
  assert.equal((await request(app).post('/api/admin/products').set(auth).send({ ...validBody(), price: -1 })).status, 400);
  assert.equal((await request(app).post('/api/admin/products').set(auth).send({ ...validBody(), categoryId: 99999999 })).status, 400);
});

test('管理員部分更新 → 200，只改指定欄位', async () => {
  const p = await createProduct(cat.id);
  const res = await request(app).put(`/api/admin/products/${p.id}`).set('Authorization', `Bearer ${admin.token}`).send({ price: 1200, isActive: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.product.price, 1200);
  assert.equal(res.body.product.isActive, false);
  assert.equal(res.body.product.name, p.name);
});

test('一般會員更新 → 403；更新不存在商品 → 404；空 body → 400', async () => {
  const p = await createProduct(cat.id);
  assert.equal((await request(app).put(`/api/admin/products/${p.id}`).set('Authorization', `Bearer ${member.token}`).send({ price: 1 })).status, 403);
  assert.equal((await request(app).put('/api/admin/products/99999999').set('Authorization', `Bearer ${admin.token}`).send({ price: 1 })).status, 404);
  assert.equal((await request(app).put(`/api/admin/products/${p.id}`).set('Authorization', `Bearer ${admin.token}`).send({})).status, 400);
});

test('沒 token 刪除 → 401；管理員刪除 → 200；再刪一次 → 404', async () => {
  const p = await createProduct(cat.id);
  assert.equal((await request(app).delete(`/api/admin/products/${p.id}`)).status, 401);
  assert.equal((await request(app).delete(`/api/admin/products/${p.id}`).set('Authorization', `Bearer ${admin.token}`)).status, 200);
  assert.equal((await request(app).delete(`/api/admin/products/${p.id}`).set('Authorization', `Bearer ${admin.token}`)).status, 404);
});
