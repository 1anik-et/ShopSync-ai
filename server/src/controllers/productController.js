/**
 * Product Controller
 * Business logic for product operations
 */
const prisma = require('../models/prisma');

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

      const query = q.trim().toLowerCase();
      
      // SQLite doesn't have native full-text search, so we do application-level filtering
      const allProducts = await prisma.product.findMany();
      
      const results = allProducts.filter(product => {
        const searchable = [
          product.name,
          product.retailer,
          product.category,
          product.description,
        ].join(' ').toLowerCase();

        // Split query into words and check if ALL words appear somewhere
        const words = query.split(/\s+/);
        return words.every(word => searchable.includes(word));
      });

      // Sort by relevance (name match > category match > description match)
      results.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(query) ? 2 : 0;
        const bNameMatch = b.name.toLowerCase().includes(query) ? 2 : 0;
        const aCatMatch = a.category.toLowerCase().includes(query) ? 1 : 0;
        const bCatMatch = b.category.toLowerCase().includes(query) ? 1 : 0;
        return (bNameMatch + bCatMatch) - (aNameMatch + aCatMatch);
      });

      res.json(results.slice(0, 20));
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
