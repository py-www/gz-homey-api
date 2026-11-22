// Route：公開商品（不用登入）
const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.detail);

module.exports = router;
