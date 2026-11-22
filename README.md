# GZ HOMEY API

GZ HOMEY 氛圍居家選物電商 — 後端 API（六角學院 前後端整合主題電商專題）

- 線上 API：`https://gz-homey-api.onrender.com/api`
- API 文件（Swagger）：`https://gz-homey-api.onrender.com/api-docs`
- 前端網站：`https://<vercel-project>.vercel.app`（前端 Repo：`gz-homey-web`）

> Render 免費方案閒置會休眠，第一次開啟可能要等 30–60 秒。

## 使用技術
- Node.js + Express 5（MVC：`routes/` → `controllers/` → Prisma models）
- PostgreSQL（Neon）+ Prisma ORM
- bcryptjs（密碼雜湊）、jsonwebtoken（JWT 驗證）
- Swagger UI（`swagger-ui-express` + 手寫 OpenAPI YAML）
- 測試：Node 內建 `node:test` + supertest

## 測試帳號
| 身分 | Email | 密碼 |
|---|---|---|
| 一般會員 | `user@gzhomey.test` | `User1234` |
| 管理員 | `admin@gzhomey.test` | `Admin1234` |

## 管理員怎麼產生
註冊 API 一律建立一般會員（就算 body 帶 `role: "ADMIN"` 也會被忽略），一般使用者無法升級。
管理員帳號只由 seed 腳本 `prisma/seed.js` 建立：`npm run db:seed`。

## 本機啟動
```bash
npm install
cp .env.example .env       # 填入下方環境變數
npx prisma migrate deploy  # 建立資料表
npm run db:seed            # 建立測試帳號、分類、24 件商品
npm run dev                # http://localhost:3000
npm test                   # 跑整合測試
```

## 環境變數
| 名稱 | 說明 |
|---|---|
| `DATABASE_URL` | Neon pooled 連線字串（一般查詢用） |
| `DIRECT_URL` | Neon direct 連線字串（migrate 用） |
| `JWT_SECRET` | JWT 簽章密鑰（一長串亂碼） |
| `PORT` | 伺服器 port，預設 3000 |
| `CORS_ORIGIN` | 允許的前端網址，多個用逗號分開 |

## API 一覽
| 方法 | 路徑 | 權限 | 說明 |
|---|---|---|---|
| POST | `/api/auth/register` | 公開 | 註冊 |
| POST | `/api/auth/login` | 公開 | 登入，回傳 JWT |
| GET | `/api/auth/me` | 會員 | 目前使用者 |
| GET | `/api/categories` | 公開 | 分類列表 |
| GET | `/api/products` | 公開 | 商品列表（`page`、`limit`、`category`、`q`） |
| GET | `/api/products/:id` | 公開 | 單一商品 |
| POST | `/api/admin/products` | 管理員 | 新增商品 |
| PUT | `/api/admin/products/:id` | 管理員 | 編輯商品 |
| DELETE | `/api/admin/products/:id` | 管理員 | 刪除商品 |
| GET | `/api/cart` | 會員 | 查看購物車 |
| POST | `/api/cart` | 會員 | 加入（重複加入數量相加） |
| PATCH | `/api/cart/:productId` | 會員 | 修改數量 |
| DELETE | `/api/cart/:productId` | 會員 | 移除 |

詳細參數與回應格式請看 `/api-docs`。

## 購物車邊界處理
- 商品不存在或已下架 → 404
- 數量為 0、負數、小數、非數字 → 400
- 數量（含購物車已有的）超過庫存 → 400
- 重複加入同商品 → 合併數量，不會產生第二筆
