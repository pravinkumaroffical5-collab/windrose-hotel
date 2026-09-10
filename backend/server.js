const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid admin credentials' });
  const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Admin login required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Forbidden');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

app.use('/api/bookings', bookingRoutes);
app.use('/api/contacts', (req,res,next) => { if (req.method === 'POST') return contactRoutes.handle(req,res,next); return res.status(401).json({error:'Admin login required'}); });
app.get('/api/admin/contacts', requireAdmin, (req,res,next)=>{ req.url='/'; contactRoutes.handle(req,res,next); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));
app.use('/api/admin/bookings', requireAdmin, bookingRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/windrose_hotels';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

module.exports = { app, requireAdmin };
