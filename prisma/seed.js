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

// 商品圖：Unsplash 免費照片（Unsplash License，可商用、不需標示），裁成 600×600 正方形
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&auto=format`;

// [名稱, 價格, 庫存, 描述, 圖片網址]；圖片網址留空時用 picsum 隨機圖暫代
const PRODUCTS = {
  candles: [
    ['木質雪松香氛蠟燭', 680, 20, '雪松與檀木的溫暖木質調，大豆蠟燃燒約 40 小時。', unsplash('1640095889747-2090ee12fa7d')],
    ['白茶無花果香氛蠟燭', 720, 15, '清新白茶結合甜美無花果，適合放在客廳。', unsplash('1757688525739-8d1e13daf44f')],
    ['薰衣草睡前蠟燭', 590, 3, '舒緩的薰衣草香氣，讓夜晚慢下來。', unsplash('1777107857518-151355201542')],
    ['琥珀麝香木芯蠟燭', 880, 12, '木製燭芯燃燒時有細微劈啪聲，像小小壁爐。', unsplash('1612293905607-b003de9e54fb')],
    ['柑橘晨光旅行蠟燭', 350, 30, '隨身鐵罐裝，柑橘香喚醒早晨。', unsplash('1785551715089-48e34e305f6d')],
    ['無香陶瓷杯蠟燭', 450, 0, '手作陶杯，燒完可當小花器。（目前缺貨）', unsplash('1603905179139-db12ab535ca9')],
  ],
  lighting: [
    ['蘑菇造型桌燈', 1680, 8, '圓潤的乳白燈罩，三段調光。', unsplash('1624878357998-491f177f2cf1')],
    ['藤編吊燈', 2380, 5, '手工藤編，灑落溫柔光影。', unsplash('1578678809569-1a8ead9cb802')],
    ['木質床頭夜燈', 980, 14, '觸控開關，暖黃光不刺眼。', unsplash('1611668190893-5131136df0a8')],
    ['復古黃銅檯燈', 2680, 4, '黃銅燈身，越用越有味道。', unsplash('1773916398209-84b1a5d95763')],
    ['星點串燈 5 米', 390, 40, 'USB 供電，掛在床頭或窗邊都好看。', unsplash('1512527884999-58eff11cbc43')],
    ['和紙落地燈', 3280, 2, '和紙燈罩透出柔和光線，客廳的焦點。', unsplash('1781441012654-bb5dced68054')],
  ],
  textiles: [
    ['亞麻水洗床包組', 2280, 10, '100% 亞麻，越洗越柔軟。', unsplash('1617325247661-675ab4b64ae2')],
    ['格紋針織毯', 1280, 18, '沙發上一披就很有氛圍。', unsplash('1674475760738-8c7af859f821')],
    ['燈芯絨抱枕套', 420, 25, '多色可選，季節換色最省錢的佈置法。', unsplash('1758946942100-12bea90d797c')],
    ['棉麻窗簾（單片）', 1580, 9, '半遮光，讓光線柔柔地進來。', unsplash('1578500467296-441a11d5d55a')],
    ['手工流蘇地墊', 1880, 6, '米白色系，搭什麼地板都好看。', unsplash('1762758889413-64d717f81b0d')],
    ['亞麻餐桌布', 780, 16, '一鋪上去，吃飯也有儀式感。', unsplash('1473973916745-60839aebf06b')],
  ],
  decor: [
    ['陶土手捏花器', 650, 12, '每一件形狀都不一樣。', unsplash('1631125915902-d8abe9225ff2')],
    ['木質香氛擴香座', 880, 20, '天然木頭吸附精油，免插電。', unsplash('1750433101188-8284e112d250')],
    ['圓形壁掛鏡', 1980, 5, '細金屬框，讓小房間看起來更大。', unsplash('1618220252344-8ec99ec624b1')],
    ['乾燥花束', 520, 15, '不用照顧也能維持好幾個月。', unsplash('1578500523703-2201d5f03bcb')],
    ['石紋托盤', 460, 22, '放鑰匙、香水或蠟燭都適合。', unsplash('1625746735133-66dccc334545')],
    ['原木書擋（一對）', 580, 10, '胡桃木，讓書櫃整齊又好看。', unsplash('1585849837997-ac13cb616ff7')],
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
    list.map(([name, price, stock, description, image], i) => ({
      name,
      price,
      stock,
      description,
      imageUrl: image || `https://picsum.photos/seed/gzhomey-${slug}-${i + 1}/600/600`,
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
