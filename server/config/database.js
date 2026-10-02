const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Ensure environment variables are loaded before accessing process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Windows / Node.js c-ares DNS fallback:
    // On Windows, Node.js c-ares DNS resolver can fail to detect the active network
    // adapter's DNS servers and defaults to [ '127.0.0.1' ]. Because there is no local
    // DNS server running on port 53, SRV record lookups (mongodb+srv://) fail with ECONNREFUSED.
    // Only in this specific faulty state, set fallback public DNS resolvers (Google / Cloudflare).
    const servers = dns.getServers();
    if (servers.length === 0 || (servers.length === 1 && servers[0] === '127.0.0.1')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB connected successfully');
    console.log(`✅ Database host: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;

