/**
 * Compare Controller
 * Handles cross-platform product price comparison requests
 */
const { compareProducts } = require('../services/compareService');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const compareController = {
  async compare(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({
          query: q || '',
          totalResults: 0,
          bestDeal: null,
          retailers: [],
          results: [],
        });
      }

      let userProfile = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
          userProfile = await prisma.user.findUnique({ where: { id: decoded.id } });
        } catch(e) {
          console.log('[Auth] Invalid token during compare', e.message);
        }
      }

      const results = await compareProducts(q.trim(), userProfile);
      res.json(results);
    } catch (err) {
      res.status(500).json({
        error: 'Failed to compare products across retailers',
        details: err.message,
      });
    }
  },

  async deal(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const { compareDeal } = require('../services/compareService');
      const results = await compareDeal(url.trim());
      res.json(results);
    } catch (err) {
      res.status(500).json({
        error: 'Failed to analyze deal URL',
        details: err.message,
      });
    }
  }
};

module.exports = compareController;
