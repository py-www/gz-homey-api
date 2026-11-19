// server.js：讀環境變數 → 啟動伺服器
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GZ HOMEY API listening on http://localhost:${PORT}`);
});
