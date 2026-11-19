// 所有路由的總入口，之後 auth / products / cart 都掛在這裡
const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/health', healthRoutes);

module.exports = router;
