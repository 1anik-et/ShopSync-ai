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

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating: parseInt(rating),
        title,
        comment
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/:reviewId/like
router.post('/:reviewId/like', requireAuth, async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.reviewId },
      data: {
        likes: { increment: 1 }
      }
    });
    res.json({ success: true, review });
  } catch (error) {
     next(error);
  }
});

module.exports = router;
