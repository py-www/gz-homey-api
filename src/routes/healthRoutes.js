// Route（路由）：只負責「哪個網址 → 交給哪個 controller」
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);
router.get('/ip', (req, res) => res.json({ ip: req.ip, ips: req.ips, xff: req.headers['x-forwarded-for'] })); // 暫時：確認 trust proxy 設定，確認完就刪

module.exports = router;
