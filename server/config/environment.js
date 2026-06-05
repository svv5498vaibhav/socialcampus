const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campusx',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshExpiryRemember: process.env.JWT_REFRESH_EXPIRY_REMEMBER || '30d',
  },

  // CSRF
  csrfSecret: process.env.CSRF_SECRET || 'default-csrf-secret',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'guardian@campusx.edu',
  },

  // OTP
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    length: parseInt(process.env.OTP_LENGTH, 10) || 6,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockTimeMinutes: parseInt(process.env.LOCK_TIME_MINUTES, 10) || 15,
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER, 10) || 5,
  },

  // Frontend
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@campusx.edu',
    password: process.env.ADMIN_PASSWORD || 'Admin@CampusX2026',
  },
};

module.exports = env;
