require('dotenv').config();
const config = require('./config');
const express = require('express');
const cors = require('cors');
const { requestLogger, errorHandler, notFound } = require('./middleware');

const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const chatRoutes = require('./routes/chat');
const sizeRoutes = require('./routes/size');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Middleware - UPDATED CORS SECTION
app.use(cors({
  origin: [
    'http://localhost:3000',               // For local React testing
    'http://localhost:5173',               // For local Vite testing (just in case)
    'https://shop-sync-ai-xi.vercel.app'   // Your live Vercel frontend!
  ],
  credentials: true,
}));

app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/size', sizeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ShopSync AI Server', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  console.log('\n  🚀 Starting ShopSync AI Server (Cloud Mode)...\n');

  app.listen(config.port, () => {
    console.log(`\n  ✨ ShopSync AI Server running on http://localhost:${config.port}`);
    console.log(`  📦 API Base: http://localhost:${config.port}/api`);
    console.log(`  🔍 Search:   GET /api/products/search?q=...`);
    console.log(`  🔍 Compare:  GET /api/products/compare?q=...`);
    console.log(`  🤖 AI Chat:  POST /api/chat`);
    console.log(`  👤 Auth:     POST /api/auth/login`);
    console.log(`  🛒 Cart:     GET/POST /api/cart\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});