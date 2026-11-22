const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, cleanup } = require('./helpers');

after(cleanup);

test('GET /api-docs/ 回傳 Swagger UI 頁面', async () => {
  const res = await request(app).get('/api-docs/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
});

test('GET /api-docs.json 包含所有主要路徑', async () => {
  const res = await request(app).get('/api-docs.json');
  assert.equal(res.status, 200);
  for (const p of ['/api/auth/register', '/api/auth/login', '/api/auth/me', '/api/categories', '/api/products', '/api/products/{id}', '/api/admin/products', '/api/admin/products/{id}', '/api/cart', '/api/cart/{productId}']) {
    assert.ok(res.body.paths[p], `缺少 ${p}`);
  }
});
