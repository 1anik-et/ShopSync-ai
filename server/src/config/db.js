const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  // First, try connecting to the configured MongoDB URI
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsync', {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`  ✅ MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.warn(`  ⚠️  Local MongoDB not available (${error.message.split('\n')[0]})`);
  }

  // Fallback: spin up an in-memory MongoDB replica
  try {
    console.log('  ⏳ Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`  ✅ MongoDB In-Memory Connected: ${mongoUri}`);
    console.log('  ℹ️  Data will not persist between restarts\n');
  } catch (memErr) {
    console.error(`  ❌ Failed to start in-memory MongoDB: ${memErr.message}`);
    console.error('  ℹ️  Chat, Auth, Orders, and Reviews will be unavailable.\n');
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
