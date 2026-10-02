const Redis = require('ioredis');
const env = require('./environment');

let redisClient = null;
let isRedisAvailable = false;

// In-memory fallback for development when Redis is not available
const memoryStore = new Map();

const createRedisClient = () => {
  if (isRedisAvailable && redisClient) return redisClient;

  try {
    const client = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 2) {
          return null; // Stop retrying
        }
        return 1000;
      },
      lazyConnect: true,
    });

    client.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('⚠️  Redis connection lost, falling back to in-memory store:', err.message);
        isRedisAvailable = false;
      }
    });

    return client;
  } catch (error) {
    return null;
  }
};

const connectRedis = async () => {
  try {
    const client = createRedisClient();
    if (!client) {
      console.log('ℹ️  Redis not configured — using in-memory cache for development.');
      return null;
    }

    // Attach temporary listener to prevent unhandled error event during initial connect
    const initialErrorHandler = () => {};
    client.on('error', initialErrorHandler);

    await client.connect();

    client.removeListener('error', initialErrorHandler);
    isRedisAvailable = true;
    redisClient = client;
    console.log('✅ Redis connected successfully');

    client.on('close', () => {
      isRedisAvailable = false;
    });

    client.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('⚠️  Redis error, falling back to in-memory store:', err.message);
        isRedisAvailable = false;
      }
    });

    return client;
  } catch (error) {
    // Intentional development fallback — prevent unhandled rejections and repeated connection retries
    isRedisAvailable = false;
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch (_) {}
      redisClient = null;
    }
    console.log(`ℹ️  Redis not running at ${env.redis.host}:${env.redis.port} — using built-in in-memory cache for development.`);
    return null;
  }
};


// Unified cache interface — uses Redis when available, in-memory otherwise
const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        return memoryStore.get(key) || null;
      }
    }
    const item = memoryStore.get(key);
    if (item && item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item ? item.value : null;
  },

  async set(key, value, expirySeconds) {
    if (isRedisAvailable && redisClient) {
      try {
        if (expirySeconds) {
          return await redisClient.setex(key, expirySeconds, value);
        }
        return await redisClient.set(key, value);
      } catch {
        // fallthrough to memory
      }
    }
    const expiry = expirySeconds ? Date.now() + expirySeconds * 1000 : null;
    memoryStore.set(key, { value, expiry });
    return 'OK';
  },

  async del(key) {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.del(key);
      } catch {
        // fallthrough to memory
      }
    }
    memoryStore.delete(key);
    return 1;
  },

  async incr(key) {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.incr(key);
      } catch {
        // fallthrough
      }
    }
    const item = memoryStore.get(key);
    const val = item ? parseInt(item.value, 10) + 1 : 1;
    memoryStore.set(key, { value: String(val), expiry: item?.expiry || null });
    return val;
  },

  async expire(key, seconds) {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.expire(key, seconds);
      } catch {
        // fallthrough
      }
    }
    const item = memoryStore.get(key);
    if (item) {
      item.expiry = Date.now() + seconds * 1000;
    }
    return 1;
  },

  async ttl(key) {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.ttl(key);
      } catch {
        // fallthrough
      }
    }
    const item = memoryStore.get(key);
    if (!item || !item.expiry) return -1;
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },

  isAvailable() {
    return isRedisAvailable;
  },
};

module.exports = { connectRedis, cache, createRedisClient };
