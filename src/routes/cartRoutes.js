// 購物車路由：整組都要登入
const express = require('express');
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', cartController.get);
router.post('/', cartController.add);
router.patch('/:productId', cartController.update);
router.delete('/:productId', cartController.remove);

module.exports = router;
