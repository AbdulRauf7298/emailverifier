# EmailVerifier SaaS Platform

A **fully functional, production-ready SaaS email verification platform** — available as both a Next.js 14 web app (Vercel) and a Docker-based FastAPI backend.

## 🚀 Next.js App (Vercel Deployment)

The primary deployment target is Vercel with Next.js 14.

### Quick Start

```bash
git clone https://github.com/AbdulRauf7298/emailverifier.git
cd emailverifier

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Tech Stack (Next.js App)

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via Supabase + Prisma ORM |
| **Auth** | NextAuth.js (Google OAuth + Credentials) |
| **Storage** | Cloudinary |
| **Cache** | Upstash Redis |
| **Email** | Gmail SMTP via Nodemailer |
| **UI** | Tailwind CSS |
| **Deployment** | Vercel |

### Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add environment variables (see [DEPLOYMENT_SETUP_GUIDE.md](./DEPLOYMENT_SETUP_GUIDE.md))
4. Deploy!

See the full **[Deployment Setup Guide](./DEPLOYMENT_SETUP_GUIDE.md)** for step-by-step instructions.

---

## 🐳 Docker Backend (Alternative)

The original Python FastAPI backend is also available for Docker-based deployment.


```bash
docker-compose up --build
```

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

---

## 🛠️ Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit env
cp .env.example .env

# Start the API server (requires running Postgres + Redis)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # Set VITE_API_URL and VITE_WOOCOMMERCE_URL
npm run dev                       # Starts on http://localhost:3000
```

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt aiosqlite
python -m pytest tests/ -v
```

All 23 unit tests cover authentication, email verification logic, credit management, and superadmin endpoints using an in-memory SQLite database (no Postgres required for tests).

---

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user (receives 10 free credits) |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/regenerate-api-key` | Generate a new API key |

### Email Verification (`/api/verify`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verify/single` | Verify a single email (1 credit) |
| `POST` | `/api/verify/bulk` | Upload CSV for bulk verification (1 credit/email) |
| `GET` | `/api/verify/bulk/{job_id}` | Poll bulk job status |
| `GET` | `/api/verify/bulk/{job_id}/results` | Get bulk job results |
| `GET` | `/api/verify/history` | Get verification history |

### Credits (`/api/credits`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/credits/balance` | Get credit balance |
| `GET` | `/api/credits/transactions` | Get transaction history |

### Superadmin (`/api/admin`) — requires superadmin role

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/users/{id}` | Get a specific user |
| `PATCH` | `/api/admin/users/{id}/activate` | Enable/disable a user |
| `POST` | `/api/admin/credits/adjust` | Add or deduct credits for any user |
| `GET` | `/api/admin/credits/transactions` | All credit transactions |
| `GET` | `/api/admin/verifications` | All verification logs |
| `GET` | `/api/admin/bulk-jobs` | All bulk jobs |
| `GET` | `/api/admin/stats` | Platform-wide statistics |

### Webhooks (`/api/webhook`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhook/woocommerce/order-completed` | WooCommerce order webhook |

---

## 💳 WooCommerce Credit Integration

1. **Create products** in WooCommerce with SKUs matching the credit pack names:
   - `credit-pack-100` → 100 credits
   - `credit-pack-500` → 500 credits
   - `credit-pack-1000` → 1,000 credits
   - `credit-pack-5000` → 5,000 credits

2. **Configure the webhook** in WooCommerce:
   - **URL**: `https://yourdomain.com/api/webhook/woocommerce/order-completed`
   - **Topic**: `Order completed`
   - **Secret**: Match your `WOOCOMMERCE_WEBHOOK_SECRET` env variable

3. When a customer completes an order, their account (matched by billing email) is **automatically credited**.

---

## 🔍 Email Verification Checks

Each verification performs:

| Check | Description |
|-------|-------------|
| **Syntax** | RFC 5322 compliant regex with auto-correction suggestions |
| **MX Records** | DNS lookup for mail exchange records |
| **SMTP** | Live SMTP handshake to verify mailbox exists |
| **Disposable** | Detection against 80+ known disposable providers |
| **Role-based** | Detects addresses like `admin@`, `noreply@`, `support@` |
| **Catch-all** | Identifies domains that accept all incoming mail |
| **Score** | Deliverability score 0–100 based on all checks |

### Status values:
- `valid` — Score >= 70, safe to email
- `risky` — Score 40-69, proceed with caution
- `invalid` — Score < 40 or verification failed

---

## 🖥️ Frontend Pages

| Page | Description |
|------|-------------|
| **Login / Register** | Auth pages with JWT |
| **Dashboard** | Credit balance, recent verifications, analytics pie chart |
| **Single Verify** | Real-time single email verification with detailed results |
| **Bulk Verify** | CSV upload with drag-and-drop, real-time progress polling |
| **History** | Paginated verification history with scores and checks |
| **Credits** | Balance card, WooCommerce purchase links, transaction log |
| **Superadmin** | User management, credit adjustments, verification logs, stats |

---

## 🔒 Security

- **JWT authentication** with configurable expiry
- **API Key** authentication via `X-API-Key` header
- **bcrypt** password hashing
- **HMAC-SHA256** WooCommerce webhook signature verification
- **Rate limiting** via slowapi (60 req/min by default)
- **CORS** configured per origin list
- **Role-based access control** (User vs Superadmin)
- **Input validation** via Pydantic schemas

---

## 📁 Project Structure

```
emailverifier/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from environment
│   │   ├── database.py          # Async SQLAlchemy engine
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── credit.py
│   │   │   └── verification.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── verification.py
│   │   │   ├── credits.py
│   │   │   ├── admin.py
│   │   │   └── webhook.py
│   │   ├── services/            # Business logic
│   │   │   ├── email_verifier.py
│   │   │   └── credit_service.py
│   │   ├── core/                # Auth, deps, cache, rate limiting
│   │   └── utils/               # Disposable domain list
│   ├── tests/                   # 23 unit tests (pytest + httpx)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # React page components
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Auth state context
│   │   ├── services/            # Axios API client
│   │   └── App.jsx              # Router with route guards
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key (change in production!) | — |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `WOOCOMMERCE_WEBHOOK_SECRET` | WooCommerce webhook secret | — |
| `SUPERADMIN_EMAIL` | Superadmin login email | — |
| `SUPERADMIN_PASSWORD` | Superadmin login password | — |
| `DEFAULT_USER_CREDITS` | Free credits on signup | `10` |
| `CREDITS_PER_VERIFICATION` | Credits per verification | `1` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `60` |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:3000"]` |

---

## License

MIT
