import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fintrack-secret-change-in-production-' + Math.random();

// DB setup
const adapter = new JSONFile(join(__dirname, 'db.json'));
const defaultData = { users: [], transactions: [] };
const db = new Low(adapter, defaultData);
await db.read();
db.data ||= defaultData;
await db.write();

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Auth middleware ──
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Auth routes ──
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  await db.read();
  if (db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, email: email.toLowerCase(), password: hash, createdAt: new Date().toISOString() };
  db.data.users.push(user);
  await db.write();

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  await db.read();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ── Transaction routes ──
app.get('/api/transactions', auth, async (req, res) => {
  await db.read();
  const txs = db.data.transactions.filter(t => t.userId === req.user.id);
  res.json(txs);
});

app.post('/api/transactions', auth, async (req, res) => {
  const { desc, cat, tag, amt, month } = req.body;
  if (!desc || !cat || !amt || month === undefined)
    return res.status(400).json({ error: 'Missing fields' });

  await db.read();
  const tx = {
    id: Date.now().toString(),
    userId: req.user.id,
    desc, cat, tag: tag || cat,
    amt: parseFloat(amt),
    month: parseInt(month),
    date: new Date().toLocaleDateString('en-IN'),
    createdAt: new Date().toISOString()
  };
  db.data.transactions.push(tx);
  await db.write();
  res.json(tx);
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  await db.read();
  const idx = db.data.transactions.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.transactions.splice(idx, 1);
  await db.write();
  res.json({ ok: true });
});

// ── Profile update ──
app.put('/api/me', auth, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password too short' });
    user.password = await bcrypt.hash(newPassword, 10);
  }
  await db.write();
  res.json({ ok: true, name: user.name });
});

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Fintrack running on http://localhost:${PORT}`));
