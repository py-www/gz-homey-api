// Controller（廚師）：會員註冊、登入、查看自己
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const httpError = require('../utils/httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 發 token：裡面只放 id 和 role，不放密碼
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// 回傳給前端的使用者資料（把 password 拿掉）
function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/register
exports.register = async (req, res) => {
  // 只拿 email / password / name，故意不拿 role → 一般人不可能把自己變 ADMIN
  const { email, password, name } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) throw httpError(400, 'Email 格式不正確');
  if (!password || password.length < 6) throw httpError(400, '密碼至少 6 個字元');
  if (!name || name.trim().length === 0 || name.length > 50) throw httpError(400, '名稱必填，最多 50 字');

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) throw httpError(409, '這個 Email 已經註冊過了');

  const hashed = await bcrypt.hash(password, 10); // 10 = 雜湊強度
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hashed, name: name.trim() },
  });

  res.status(201).json({ ok: true, token: signToken(user), user: publicUser(user) });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw httpError(400, '請輸入 Email 和密碼');

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // 帳號不存在或密碼錯，都回同一句話 → 不讓壞人知道哪個 Email 有註冊
  const match = user && (await bcrypt.compare(password, user.password));
  if (!match) throw httpError(401, 'Email 或密碼錯誤');

  res.json({ ok: true, token: signToken(user), user: publicUser(user) });
};

// GET /api/auth/me（需登入）：前端重新整理後，用 token 拿回使用者資料
exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw httpError(404, '找不到使用者');
  res.json({ ok: true, user: publicUser(user) });
};
