const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ── CORS ──
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());

// ── Body parser ──
app.use(express.json());

// ── Rate limiting ──
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Root ──
app.get('/', (req, res) =>
  res.json({ message: '🚀 DeliverVerify API is running', health: '/api/health' })
);

// ── Health check (no DB needed) ──
app.get('/api/health', (req, res) =>
  res.json({
    status: 'OK',
    timestamp: new Date(),
    env: process.env.NODE_ENV || 'unknown',
    mongo: !!process.env.MONGO_URI,
    jwt: !!process.env.JWT_SECRET,
  })
);

// ── MongoDB (cached for serverless) ──
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI)
    throw new Error('MONGO_URI env var is not set on Vercel');
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

const withDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB error:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
};

// ── Routes ──
app.use('/api', withDB, require('./routes/auth'));
app.use('/api', withDB, require('./routes/products'));
app.use('/api', withDB, require('./routes/orders'));
app.use('/api', withDB, require('./routes/otp'));
app.use('/api', withDB, require('./routes/admin'));
app.use('/api', withDB, require('./routes/agent'));

// ── 404 ──
app.use('/api/*', (req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
);

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Something went wrong' });
});

// ── Local dev only ──
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`)))
    .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
}

module.exports = app;