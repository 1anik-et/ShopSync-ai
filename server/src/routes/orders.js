const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/orders/history
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/checkout
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const { cartItems } = req.body;
    
    // Group cart items by retailer
    const itemsByRetailer = {};
    for (const item of cartItems) {
      const retailer = item.retailer || 'Unknown Retailer';
      if (!itemsByRetailer[retailer]) {
        itemsByRetailer[retailer] = { totalAmount: 0, items: [] };
      }
      itemsByRetailer[retailer].items.push({
        productId: String(item.id || item.productId),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
        productUrl: item.productUrl || ''
      });
      itemsByRetailer[retailer].totalAmount += (item.price * (item.quantity || 1));
    }

    const createdOrders = [];
    // Place separate orders for each retailer natively in DB
    for (const [retailer, data] of Object.entries(itemsByRetailer)) {
       const newOrder = await prisma.order.create({
         data: {
           userId: req.user.id,
           retailer,
           totalAmount: data.totalAmount,
           status: 'Pending',
           items: {
             create: data.items
           }
         },
         include: { items: true }
       });
       createdOrders.push(newOrder);
    }

    res.json({ success: true, orders: createdOrders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
