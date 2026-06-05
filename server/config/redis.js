const Redis = require('ioredis');
const env = require('./environment');

let redisClient = null;
let isRedisAvailable = false;

// In-memory fallback for development when Redis is not available
const memoryStore = new Map();

const createRedisClient = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️  Redis: Max retries reached, falling back to in-memory store');
          isRedisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('⚠️  Redis error, falling back to in-memory store:', err.message);
        isRedisAvailable = false;
      }
    });

    redisClient.on('close', () => {
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis initialization failed, using in-memory store:', error.message);
    isRedisAvailable = false;
    return null;
  }
};

const connectRedis = async () => {
  const client = createRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (error) {
      console.warn('⚠️  Redis connect failed, using in-memory fallback:', error.message);
      isRedisAvailable = false;
    }
  }
  return client;
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
