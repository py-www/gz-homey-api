// app.js：組裝 Express（中介軟體 + 路由 + 錯誤處理），不負責啟動
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// API 文件：讀手寫的 OpenAPI YAML
const openapiDoc = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));

const app = express();
app.disable('x-powered-by'); // 不告訴外人後端用 Express
// Render 前面有 3 層 proxy（11/23 線上量到 X-Forwarded-For = 使用者, Cloudflare, Render 內部），
// 設 3 讓 req.ip 是使用者真正的 IP；設太小會拿到 Render 內部共用 IP，設太大使用者可以偽造
app.set('trust proxy', 3);

// CORS：允許哪些前端網址呼叫這個 API（多個用逗號分開）
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, callback) {
      // 沒有 origin（Postman、伺服器之間呼叫）也允許
      // 不在名單：不帶 CORS header，瀏覽器自己會擋；不丟錯誤，免得變成 500
      return callback(null, !origin || allowedOrigins.includes(origin));
    },
  }),
);
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, message: 'GZ HOMEY API，文件請看 /api-docs' }));
app.get('/api-docs.json', (req, res) => res.json(openapiDoc));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: 'GZ HOMEY API 文件' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
