/**
 * Product Controller
 * Business logic for product operations.
 * Search now uses the live masterSearchService for real-time multi-retailer results.
 */
const prisma = require('../models/prisma');
const { getUnifiedResults } = require('../services/apiSearchService');
const jwt = require('jsonwebtoken');

const productController = {
  async getAll(req, res) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
  },

  async getById(req, res) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch product', details: err.message });
    }
  },

  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      // Extract user profile from auth token if available
      let userProfile = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
          userProfile = await prisma.user.findUnique({ where: { id: decoded.id } });
        } catch (e) {
          // Token invalid, continue without profile
        }
      }

      // Use the live master search service for real-time results
      const results = await getUnifiedResults(q.trim(), userProfile);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Search failed', details: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, price, originalPrice, image, retailer, category, description, sourceUrl } = req.body;
      const product = await prisma.product.create({
        data: {
          name: name || 'Unknown Product',
          price: parseFloat(price) || 0,
          originalPrice: parseFloat(originalPrice) || parseFloat(price) || 0,
          image: image || '',
          retailer: retailer || 'Unknown',
          category: category || 'General',
          description: description || '',
          sourceUrl: sourceUrl || '',
        },
      });
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create product', details: err.message });
    }
  },

  async toggleTracking(req, res) {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: { isTracking: !product.isTracking },
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle tracking', details: err.message });
    }
  },
};

module.exports = productController;
