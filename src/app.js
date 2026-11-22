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

app.get('/', (req, res) => res.json({ ok: true, message: 'GZ HOMEY API，文件請看 /api-docs' }));
app.get('/api-docs.json', (req, res) => res.json(openapiDoc));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: 'GZ HOMEY API 文件' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
