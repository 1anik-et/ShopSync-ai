/**
 * Cart Controller
 * Business logic for cart operations
 */
const prisma = require('../models/prisma');

const cartController = {
  async getAll(req, res) {
    try {
      const items = await prisma.cartItem.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch cart', details: err.message });
    }
  },

  async addItem(req, res) {
    try {
      const { name, price, image, retailer, size, color, quantity, sourceUrl } = req.body;

      // Check for duplicate
      const existing = await prisma.cartItem.findFirst({
        where: { name: name, retailer: retailer },
      });

      if (existing) {
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + (quantity || 1) },
        });
        return res.json(updated);
      }

      const item = await prisma.cartItem.create({
        data: {
          name: name || 'Unknown Item',
          price: Math.round(parseFloat(price) || 0),
          image: image || '',
          retailer: retailer || 'Unknown',
          size: size || '',
          color: color || '',
          quantity: quantity || 1,
          sourceUrl: sourceUrl || '',
        },
      });
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add to cart', details: err.message });
    }
  },

  async updateQuantity(req, res) {
    try {
      const { quantity } = req.body;
      if (quantity < 1) {
        await prisma.cartItem.delete({ where: { id: req.params.id } });
        return res.json({ deleted: true });
      }
      const updated = await prisma.cartItem.update({
        where: { id: req.params.id },
        data: { quantity: parseInt(quantity) },
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update cart item', details: err.message });
    }
  },

  async removeItem(req, res) {
    try {
      await prisma.cartItem.delete({ where: { id: req.params.id } });
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete cart item', details: err.message });
    }
  },

  async clearCart(req, res) {
    try {
      await prisma.cartItem.deleteMany();
      res.json({ cleared: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear cart', details: err.message });
    }
  },
};

module.exports = cartController;
