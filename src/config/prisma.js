// 整個專案共用同一個 Prisma 連線（不要每個檔案都 new 一次）
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
