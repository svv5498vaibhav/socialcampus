const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const env = require('./config/environment');
const connectDatabase = require('./config/database');
const { connectRedis } = require('./config/redis');

// Middleware
const { generalLimiter } = require('./middleware/rateLimiter');
const { inputSanitizer } = require('./middleware/inputSanitizer');
const { deviceTracker } = require('./middleware/deviceTracker');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const securityRoutes = require('./routes/securityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ProfilePilot AI Routes
const onboardingRoutes = require('./routes/onboardingRoutes');
const profilePilotRoutes = require('./routes/profilePilotRoutes');

// FeedSense AI Routes
const feedRoutes = require('./routes/feedRoutes');

// RankForge AI Routes
const gamificationRoutes = require('./routes/gamificationRoutes');

// SafeVoice AI Routes
const anonymousRoutes = require('./routes/anonymousRoutes');

// BranchConnect & CreatorBoost Routes
const collaborationRoutes = require('./routes/collaborationRoutes');
const creatorRoutes = require('./routes/creatorRoutes');

// PulseNotify AI Routes
const pulseRoutes = require('./routes/pulseRoutes');

const app = express();


// =========================
// Security Middleware
// =========================
app.use(helmet({
  contentSecurityPolicy: env.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token'],
}));

app.use(hpp()); // HTTP Parameter Pollution protection

// =========================
// Body Parsing
// =========================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// =========================
// Request Processing
// =========================
app.use(morgan(env.isDev ? 'dev' : 'combined'));
app.use(generalLimiter);
app.use(inputSanitizer);
app.use(deviceTracker);

// Trust proxy for correct IP behind reverse proxy
app.set('trust proxy', 1);

// =========================
// Health Check
// =========================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Guardian AI is operational',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// =========================
// API Routes
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/auth', verificationRoutes);
app.use('/api/auth', recoveryRoutes);
app.use('/api/security/sessions', sessionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// ProfilePilot AI
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profilePilotRoutes);

// FeedSense AI
app.use('/api/feed', feedRoutes);

// RankForge AI
app.use('/api/gamification', gamificationRoutes);

// SafeVoice AI
app.use('/api/anonymous', anonymousRoutes);

// BranchConnect & CreatorBoost AI
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/creator', creatorRoutes);

// PulseNotify AI
app.use('/api/pulse', pulseRoutes);

// =========================
// 404 Handler
// =========================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
});

// =========================
// Global Error Handler
// =========================
app.use(errorHandler);

// =========================
// Server Startup
// =========================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis (graceful — won't crash if unavailable)
    await connectRedis();

    // Seed admin user if not exists
    const User = require('./models/User');
    const { hashPassword } = require('./utils/passwordUtils');
    const existingAdmin = await User.findOne({ email: env.admin.email });
    if (!existingAdmin) {
      await User.create({
        email: env.admin.email,
        passwordHash: await hashPassword(env.admin.password),
        firstName: 'Admin',
        lastName: 'CampusX',
        college: 'CampusX HQ',
        branch: 'Administration',
        semester: '1',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        isVerified: true,
        riskLevel: 'low',
        onboardingCompleted: true,
      });
      console.log('✅ Admin account created:', env.admin.email);
    }

    // Start listening with HTTP server for Socket.IO
    const http = require('http');
    const server = http.createServer(app);
    const { initSocket } = require('./services/socketService');
    const io = initSocket(server);
    app.set('io', io);

    // Run background cron jobs (Trending calculator, etc.)
    const TrendingEngine = require('./services/trendingEngine');
    // Calculate trends initially, and then run every hour
    TrendingEngine.calculateTrends().catch(err => console.error('Initial trending computation failed:', err));
    setInterval(() => {
      TrendingEngine.calculateTrends().catch(err => console.error('Interval trending computation failed:', err));
    }, 60 * 60 * 1000); // 1 hour

    // Start RankForge AI daily snapshot cron scheduler
    const GamificationCron = require('./services/gamificationCron');
    GamificationCron.startScheduler();

    server.listen(env.port, () => {
      console.log('\n🛡️  ═══════════════════════════════════════════');
      console.log(`   Guardian + FeedSense AI Server — ${env.nodeEnv.toUpperCase()}`);
      console.log(`   Port: ${env.port}`);
      console.log(`   Client: ${env.clientUrl}`);
      console.log('   ═══════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
