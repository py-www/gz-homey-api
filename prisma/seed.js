// Seed：建立測試帳號、分類、商品。執行：npm run db:seed
// ⚠️ 重跑會「重設」這 4 個分類底下的商品（購物車裡的這些商品也會一起清掉）
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const USERS = [
  { email: 'admin@gzhomey.test', password: 'Admin1234', name: 'GZ 管理員', role: 'ADMIN' },
  { email: 'user@gzhomey.test', password: 'User1234', name: '測試會員', role: 'USER' },
];

const CATEGORIES = [
  { slug: 'candles', name: '香氛蠟燭' },
  { slug: 'lighting', name: '燈具照明' },
  { slug: 'textiles', name: '織品寢飾' },
  { slug: 'decor', name: '生活擺飾' },
];

// [名稱, 價格, 庫存, 描述]
const PRODUCTS = {
  candles: [
    ['木質雪松香氛蠟燭', 680, 20, '雪松與檀木的溫暖木質調，大豆蠟燃燒約 40 小時。'],
    ['白茶無花果香氛蠟燭', 720, 15, '清新白茶結合甜美無花果，適合放在客廳。'],
    ['薰衣草睡前蠟燭', 590, 3, '舒緩的薰衣草香氣，讓夜晚慢下來。'],
    ['琥珀麝香木芯蠟燭', 880, 12, '木製燭芯燃燒時有細微劈啪聲，像小小壁爐。'],
    ['柑橘晨光旅行蠟燭', 350, 30, '隨身鐵罐裝，柑橘香喚醒早晨。'],
    ['無香陶瓷杯蠟燭', 450, 0, '手作陶杯，燒完可當小花器。（目前缺貨）'],
  ],
  lighting: [
    ['蘑菇造型桌燈', 1680, 8, '圓潤的乳白燈罩，三段調光。'],
    ['藤編吊燈', 2380, 5, '手工藤編，灑落溫柔光影。'],
    ['木質床頭夜燈', 980, 14, '觸控開關，暖黃光不刺眼。'],
    ['復古黃銅檯燈', 2680, 4, '黃銅燈身，越用越有味道。'],
    ['星點串燈 5 米', 390, 40, 'USB 供電，掛在床頭或窗邊都好看。'],
    ['和紙落地燈', 3280, 2, '和紙燈罩透出柔和光線，客廳的焦點。'],
  ],
  textiles: [
    ['亞麻水洗床包組', 2280, 10, '100% 亞麻，越洗越柔軟。'],
    ['格紋針織毯', 1280, 18, '沙發上一披就很有氛圍。'],
    ['燈芯絨抱枕套', 420, 25, '多色可選，季節換色最省錢的佈置法。'],
    ['棉麻窗簾（單片）', 1580, 9, '半遮光，讓光線柔柔地進來。'],
    ['手工流蘇地墊', 1880, 6, '米白色系，搭什麼地板都好看。'],
    ['亞麻餐桌布', 780, 16, '一鋪上去，吃飯也有儀式感。'],
  ],
  decor: [
    ['陶土手捏花器', 650, 12, '每一件形狀都不一樣。'],
    ['木質香氛擴香座', 880, 20, '天然木頭吸附精油，免插電。'],
    ['圓形壁掛鏡', 1980, 5, '細金屬框，讓小房間看起來更大。'],
    ['乾燥花束', 520, 15, '不用照顧也能維持好幾個月。'],
    ['石紋托盤', 460, 22, '放鑰匙、香水或蠟燭都適合。'],
    ['原木書擋（一對）', 580, 10, '胡桃木，讓書櫃整齊又好看。'],
  ],
};

async function main() {
  for (const u of USERS) {
    const password = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, password, name: u.name, role: u.role },
      update: { password, name: u.name, role: u.role },
    });
  }

  const categoryIds = {};
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: { name: c.name } });
    categoryIds[c.slug] = category.id;
  }

  await prisma.product.deleteMany({ where: { categoryId: { in: Object.values(categoryIds) } } });

  const data = Object.entries(PRODUCTS).flatMap(([slug, list]) =>
    list.map(([name, price, stock, description], i) => ({
      name,
      price,
      stock,
      description,
      imageUrl: `https://picsum.photos/seed/gzhomey-${slug}-${i + 1}/600/600`,
      categoryId: categoryIds[slug],
    })),
  );
  await prisma.product.createMany({ data });

  console.log(`Seed 完成：${USERS.length} 個帳號、${CATEGORIES.length} 個分類、${data.length} 件商品`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
