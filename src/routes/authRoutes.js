// Route（帶位員）：會員相關網址 → 交給 authController
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me); // 先過門口檢查，再進廚房

module.exports = router;
