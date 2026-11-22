// 管理員商品路由：整組都要「已登入 + 是管理員」
const express = require('express');
const adminProductController = require('../controllers/adminProductController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.post('/', adminProductController.create);
router.put('/:id', adminProductController.update);
router.delete('/:id', adminProductController.remove);

module.exports = router;
