// Route（把網址 + HTTP method 對應到 controller 函式）：會員相關網址 → 交給 authController
const express = require('express');
const authController = require('../controllers/authController');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// 防暴力猜密碼：同一台電腦（IP）對同一個 Email 15 分鐘內登入失敗 10 次就先擋（成功的不算）
// key 是「IP + Email」：只用 Email 的話，任何人故意連錯 10 次就能把別人的帳號鎖住
// （req.ip 要靠 app.js 的 trust proxy 才是使用者真正的 IP）
// shortcut: 次數存在記憶體，重啟就歸零、多台機器各算各的，之後要多台時改用 Redis store
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').trim().toLowerCase()}`,
  message: { ok: false, message: '登入失敗太多次，請 15 分鐘後再試' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', requireAuth, authController.me); // 先跑 requireAuth 驗證 token，通過才執行 controller

module.exports = router;
