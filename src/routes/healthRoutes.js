// Route（路由）：只負責「哪個網址 → 交給哪個 controller」
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);

module.exports = router;
