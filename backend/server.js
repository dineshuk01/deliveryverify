const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();

// ── CORS ──
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
].filter(Boolean).map(o => o.replace(/\/+$/, '')); // strip trailing slashes

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, same-origin)
    if (!origin) return cb(null, true);
    // Strip trailing slash from incoming origin too
    const cleanOrigin = origin.replace(/\/+$/, '');
    // Allow if: exact match, dev mode, or it's a Vercel preview deploy of the same project
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      process.env.NODE_ENV !== 'production' ||
      (process.env.VERCEL_PROJECT_NAME && cleanOrigin.includes(process.env.VERCEL_PROJECT_NAME));
    if (isAllowed) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight for all routes
app.options('*', cors());

// ── Raw body for Razorpay webhook (must be BEFORE express.json) ──
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ── JSON body parser ──
app.use(express.json());

// ── Rate limiting ──
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── MongoDB connection (cached for serverless) ──
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/delivery-verification';
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
};

// Middleware to ensure DB is connected on each request (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// ── Root route (confirms backend is alive) ──
app.get('/', (req, res) =>
  res.json({ message: '🚀 DeliverVerify API is running', docs: '/api/health' })
);

// ── Health check ──
app.get('/api/health', (req, res) =>
  res.json({
    status: 'OK',
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    razorpay: !!process.env.RAZORPAY_KEY_ID,
  })
);

// ── Routes ──
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/otp'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/agent'));
app.use('/api', require('./routes/payment'));

// ── 404 handler ──
app.use('/api/*', (req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
);

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ── Local dev server (not used in Vercel serverless) ──
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '⚠️  Add keys to .env'}`);
    });
  }).catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });
}

// ── Export for Vercel serverless ──
module.exports = app;