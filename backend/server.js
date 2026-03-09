const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── CORS — allow all origins (lock down after confirming it works) ──
app.use(cors({
  origin: true,               // reflect any origin — safe while debugging
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());

// ── Raw body for Razorpay webhook (must be BEFORE express.json) ──
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ── JSON body parser ──
app.use(express.json());

// ── Root — confirms the function is alive ──
app.get('/', (req, res) =>
  res.json({ message: '🚀 DeliverVerify API is running', health: '/api/health' })
);

// ── Health check — no DB needed, always responds ──
app.get('/api/health', (req, res) =>
  res.json({
    status: 'OK',
    timestamp: new Date(),
    env: process.env.NODE_ENV || 'unknown',
    mongo: !!process.env.MONGO_URI,
    jwt:   !!process.env.JWT_SECRET,
    razorpay: !!process.env.RAZORPAY_KEY_ID,
  })
);

// ── MongoDB connection (cached for serverless cold starts) ──
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI env var is not set');
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

// ── DB middleware — attach to every route that needs it ──
const withDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
};

// ── Routes (all go through withDB) ──
app.use('/api', withDB, require('./routes/auth'));
app.use('/api', withDB, require('./routes/products'));
app.use('/api', withDB, require('./routes/orders'));
app.use('/api', withDB, require('./routes/otp'));
app.use('/api', withDB, require('./routes/admin'));
app.use('/api', withDB, require('./routes/agent'));
app.use('/api', withDB, require('./routes/payment'));

// ── 404 for unknown API routes ──
app.use('/api/*', (req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
);

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
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