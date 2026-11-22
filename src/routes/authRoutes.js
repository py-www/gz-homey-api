// Route（把網址 + HTTP method 對應到 controller 函式）：會員相關網址 → 交給 authController
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me); // 先跑 requireAuth 驗證 token，通過才執行 controller

module.exports = router;
