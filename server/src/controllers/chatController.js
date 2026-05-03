/**
 * Chat Controller
 * Business logic for AI chat operations.
 * Uses Prisma (SQLite) for message persistence — no MongoDB dependency.
 * Falls back to in-memory storage if Prisma encounters issues.
 */
const prisma = require('../models/prisma');
const { generateMultimodalResponse } = require('../services/ai');

// In-memory fallback for chat when DB is not available
let memoryMessages = [];

const chatController = {
  async getHistory(req, res) {
    try {
      const messages = await prisma.chatMessage.findMany({
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      return res.json(messages);
    } catch (err) {
      // Fallback: return in-memory messages
      res.json(memoryMessages.slice(-50));
    }
  },

  async sendMessage(req, res) {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required' });

      const trimmedText = text.trim();
      let userMessage, aiMessage;

      // Get product context (use recently scraped products, fallback to Prisma)
      let products = [];
      if (global.latestScrapedProducts && global.latestScrapedProducts.length > 0) {
        products = global.latestScrapedProducts;
      } else {
        try {
          const dbProducts = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
          products = dbProducts;
        } catch (dbErr) {
          // Silently continue without product context
        }
      }

      // Get conversation history (best-effort)
      let history = [];
      try {
        const dbHistory = await prisma.chatMessage.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        history = dbHistory.reverse();
      } catch (dbErr) {
        history = memoryMessages.slice(-10);
      }

      // Generate AI response
      const aiText = await generateMultimodalResponse(trimmedText, products, history);

      // Save messages to Prisma (SQLite)
      try {
        userMessage = await prisma.chatMessage.create({
          data: { sender: 'user', text: trimmedText },
        });
        aiMessage = await prisma.chatMessage.create({
          data: { sender: 'ai', text: aiText },
        });
      } catch (saveErr) {
        // DB save failed, use in-memory fallback
        userMessage = { id: 'mem_u_' + Date.now(), sender: 'user', text: trimmedText, createdAt: new Date() };
        aiMessage = { id: 'mem_a_' + Date.now(), sender: 'ai', text: aiText, createdAt: new Date() };
        memoryMessages.push(userMessage, aiMessage);
      }

      res.json({ userMessage, aiMessage });
    } catch (err) {
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Failed to process chat', details: err.message });
    }
  },

  async clearHistory(req, res) {
    try {
      await prisma.chatMessage.deleteMany();
      memoryMessages = [];
      res.json({ cleared: true });
    } catch (err) {
      memoryMessages = [];
      res.json({ cleared: true });
    }
  },
};

module.exports = chatController;
