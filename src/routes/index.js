// 所有路由的總入口
const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const adminProductRoutes = require('./adminProductRoutes');
const cartRoutes = require('./cartRoutes');

const router = express.Router();

// 繳交的後端網址是 /api，直接打開要看得到 API 正常
router.get('/', (req, res) => res.json({ ok: true, message: 'GZ HOMEY API 正常運作，文件請看 /api-docs' }));
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/cart', cartRoutes);

module.exports = router;
