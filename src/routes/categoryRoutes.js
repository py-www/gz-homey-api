// Route（把網址 + HTTP method 對應到 controller 函式）：商品分類（公開）
const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoryController.list);

module.exports = router;
