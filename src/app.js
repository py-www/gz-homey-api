// app.js：組裝 Express（中介軟體 + 路由 + 錯誤處理），不負責啟動
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// CORS：允許哪些前端網址呼叫這個 API（多個用逗號分開）
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, callback) {
      // 沒有 origin（Postman、伺服器之間呼叫）也允許
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, message: 'GZ HOMEY API，請使用 /api 開頭的路徑' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
