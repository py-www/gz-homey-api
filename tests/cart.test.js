const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, createUser, createCategory, createProduct, cleanup } = require('./helpers');

let member;
let product; // stock 5
let inactive;
let auth;

before(async () => {
  member = await createUser();
  auth = { Authorization: `Bearer ${member.token}` };
  const cat = await createCategory();
  product = await createProduct(cat.id, { stock: 5, price: 300 });
  inactive = await createProduct(cat.id, { isActive: false });
});
after(cleanup);

const add = (body) => request(app).post('/api/cart').set(auth).send(body);

test('沒登入看購物車 → 401', async () => {
  assert.equal((await request(app).get('/api/cart')).status, 401);
});

test('加入不存在的商品 → 404', async () => {
  assert.equal((await add({ productId: 99999999, quantity: 1 })).status, 404);
});

test('加入已下架商品 → 404', async () => {
  assert.equal((await add({ productId: inactive.id, quantity: 1 })).status, 404);
});

test('數量 0 / -1 / 1.5 / "abc" → 400', async () => {
  for (const quantity of [0, -1, 1.5, 'abc']) {
    const res = await add({ productId: product.id, quantity });
    assert.equal(res.status, 400, `quantity=${quantity} 應該 400`);
  }
});

test('數量超過庫存 → 400', async () => {
  assert.equal((await add({ productId: product.id, quantity: 6 })).status, 400);
});

test('加入 2 件 → 201，總數與金額正確', async () => {
  const res = await add({ productId: product.id, quantity: 2 });
  assert.equal(res.status, 201);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].quantity, 2);
  assert.equal(res.body.totalQuantity, 2);
  assert.equal(res.body.totalPrice, 600);
});

test('重複加入同商品（不帶 quantity 預設 1）→ 數量相加為 3，仍只有 1 筆', async () => {
  const res = await add({ productId: product.id });
  assert.equal(res.status, 201);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].quantity, 3);
});

test('重複加入後總數超過庫存 → 400，原數量不變', async () => {
  const res = await add({ productId: product.id, quantity: 3 }); // 3 + 3 = 6 > 5
  assert.equal(res.status, 400);
  const cart = await request(app).get('/api/cart').set(auth);
  assert.equal(cart.body.items[0].quantity, 3);
});

test('PATCH 改數量 → 200；改成 0 → 400；超過庫存 → 400', async () => {
  const ok = await request(app).patch(`/api/cart/${product.id}`).set(auth).send({ quantity: 5 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.items[0].quantity, 5);
  assert.equal((await request(app).patch(`/api/cart/${product.id}`).set(auth).send({ quantity: 0 })).status, 400);
  assert.equal((await request(app).patch(`/api/cart/${product.id}`).set(auth).send({ quantity: 6 })).status, 400);
});

test('PATCH 不在購物車的商品 → 404', async () => {
  assert.equal((await request(app).patch('/api/cart/99999999').set(auth).send({ quantity: 1 })).status, 404);
});

test('DELETE 移除 → 200 購物車變空；再刪一次 → 404', async () => {
  const res = await request(app).delete(`/api/cart/${product.id}`).set(auth);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items, []);
  assert.equal(res.body.totalQuantity, 0);
  assert.equal((await request(app).delete(`/api/cart/${product.id}`).set(auth)).status, 404);
});
