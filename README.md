# Fintrack — Multi-User Personal Finance Tracker

A full-stack personal finance tracker with user authentication. Each user has their own private data. Track income, expenses, investments, and savings month by month.

## Features

- **Authentication** — Register / login with email + password (bcrypt hashed, JWT sessions)
- **Per-user data** — Complete data isolation between users
- **Monthly tracking** — Income, Expense, Investment, Saving categories
- **Visual charts** — Doughnut breakdown + expense-by-tag bar chart
- **Income allocation bar** — See where your money goes at a glance
- **CSV export** — Download any month's data
- **Profile management** — Change name and password
- **Mobile responsive** — Works on all screen sizes

---

## Local Development

```bash
# Install dependencies
npm install

# Start server (runs on http://localhost:3000)
npm start

# Dev mode with auto-reload
npm run dev
```

---

## Deploy to Railway (Recommended — Free tier available)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: `JWT_SECRET` = any long random string
5. Railway auto-detects Node.js and deploys. You get a public URL instantly.

**Set JWT_SECRET in Railway:**
- Dashboard → your project → Variables → Add `JWT_SECRET` = `your-super-secret-key-here`

---

## Deploy to Render (Free tier available)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add env var: `JWT_SECRET` = any long random string
6. Deploy

---

## Deploy to Fly.io

```bash
# Install flyctl, then:
fly launch
fly secrets set JWT_SECRET=your-super-secret-key
fly deploy
```

---

## Deploy with Docker

```bash
docker build -t fintrack .
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/data:/app/data \
  fintrack
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens. Use a long random string in production. |
| `PORT` | No | Port to listen on (default: 3000) |

**Important:** Always set a strong `JWT_SECRET` in production. Never use the default.

---

## Data Storage

User accounts and transactions are stored in `db.json` (lowdb / JSON file). This is fine for personal use and small teams.

For larger scale, you can swap the lowdb adapter for a PostgreSQL/MySQL connection — the API layer stays the same.

---

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWTs expire after 30 days
- Each API route validates the JWT and scopes data to the authenticated user
- Users can only read/delete their own transactions
