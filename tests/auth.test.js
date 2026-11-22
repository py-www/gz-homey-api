const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, TAG, createUser, cleanup } = require('./helpers');

after(cleanup);

const email = `${TAG}-reg@test.local`;

test('註冊時帶 role: "ADMIN" 仍然只會是 USER，且不回傳密碼', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'secret123', name: '想當管理員', role: 'ADMIN' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'USER');
  assert.equal(res.body.user.password, undefined);
  assert.ok(res.body.token);
});

test('重複註冊同一個 Email → 409', async () => {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'secret123', name: 'A' });
  assert.equal(res.status, 409);
});

test('Email 格式錯誤 → 400', async () => {
  const res = await request(app).post('/api/auth/register').send({ email: 'abc', password: 'secret123', name: 'A' });
  assert.equal(res.status, 400);
});

test('登入密碼錯誤 → 401；正確 → 200 有 token', async () => {
  const bad = await request(app).post('/api/auth/login').send({ email, password: 'wrong-pass' });
  assert.equal(bad.status, 401);
  const good = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
  assert.equal(good.status, 200);
  assert.ok(good.body.token);
});

test('email / password 不是字串 → 400（不是 500）', async () => {
  const cases = [
    ['/api/auth/login', { email: 123, password: 'x' }],
    ['/api/auth/login', { email, password: 123 }],
    ['/api/auth/register', { email: ['a@b.co'], password: 'secret123', name: 'A' }],
    ['/api/auth/register', { email: `${TAG}-x@test.local`, password: 1234567, name: 'A' }],
  ];
  for (const [path, body] of cases) {
    const res = await request(app).post(path).send(body);
    assert.equal(res.status, 400, `${path} ${JSON.stringify(body)}`);
  }
});

test('回應不帶 x-powered-by header', async () => {
  const res = await request(app).get('/');
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('同一個 Email 登入失敗超過 10 次 → 429，換別的 Email 不受影響', async () => {
  const target = `${TAG}-brute@test.local`;
  for (let i = 0; i < 10; i += 1) {
    const res = await request(app).post('/api/auth/login').send({ email: target, password: 'wrong' });
    assert.equal(res.status, 401);
  }
  const blocked = await request(app).post('/api/auth/login').send({ email: target.toUpperCase(), password: 'wrong' });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.ok, false);
  const other = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
  assert.equal(other.status, 200);
});

test('沒帶 token 打 /api/auth/me → 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('帶 token 打 /api/auth/me → 200 回傳自己', async () => {
  const { user, token } = await createUser();
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, user.id);
});
