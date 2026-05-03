/**
 * Server Configuration
 * Centralizes all environment variables and app settings
 */
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  cors: {
    origins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
    ],
    credentials: true,
  },

  ai: {
    // If user adds a Gemini/OpenAI key later, it can be used here
    apiKey: process.env.AI_API_KEY || null,
    provider: process.env.AI_PROVIDER || 'local', // 'local' | 'gemini' | 'openai'
    maxHistoryLength: 20,
  },

  search: {
    minQueryLength: 2,
    maxResults: 20,
  },
};
