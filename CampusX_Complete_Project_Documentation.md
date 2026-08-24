# 🛡️ CampusX — Complete Project Documentation (Top-to-Bottom)

> **Purpose of this document**: This is a self-contained, exhaustive reference for the entire CampusX codebase. You can paste this into any AI (ChatGPT, Claude, Gemini, etc.) to give it full context about the project's architecture, APIs, routes, database models, middleware, services, real-time system, and client-side structure.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [The 8 AI Agents (Feature Modules)](#5-the-8-ai-agents-feature-modules)
6. [Server Entry Point (server.js)](#6-server-entry-point-serverjs)
7. [Configuration Layer](#7-configuration-layer)
8. [Database Models (64 Mongoose Models)](#8-database-models-64-mongoose-models)
9. [Middleware Pipeline](#9-middleware-pipeline)
10. [Utility Layer](#10-utility-layer)
11. [Validators](#11-validators)
12. [Repository Layer](#12-repository-layer)
13. [Service Layer (57 Services/Engines)](#13-service-layer-57-servicesengines)
14. [All API Routes (Complete Reference)](#14-all-api-routes-complete-reference)
15. [Real-Time System (Socket.IO)](#15-real-time-system-socketio)
16. [Cron Jobs & Background Tasks](#16-cron-jobs--background-tasks)
17. [Client-Side Architecture](#17-client-side-architecture)
18. [Authentication Flow (End-to-End)](#18-authentication-flow-end-to-end)
19. [Environment Variables](#19-environment-variables)
20. [Seed Data](#20-seed-data)
21. [Tests](#21-tests)

---

## 1. Project Overview

**CampusX** is a full-stack social campus platform exclusively for college students. It combines 8 specialized "AI Agent" modules into one unified platform:

- A social feed with AI-powered content ranking
- Gamification with leaderboards, badges, achievements, and a reward shop
- Anonymous feedback system with toxicity detection
- Community collaboration with mentorship, teams, and events
- Creator tools for projects, blogs, and resources
- Smart notifications with career insights
- Multi-layered security with trust scoring and fraud detection
- AI-guided profile building with career recommendations

The platform is a **monorepo** with two main directories: `server/` (Node.js/Express backend) and `client/` (React/Vite frontend).

---

## 2. Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **Express.js v4** | HTTP framework |
| **MongoDB + Mongoose v8** | Primary database + ODM |
| **Redis (ioredis)** | Caching, rate limiting, presence tracking, Socket.IO adapter. **Falls back to in-memory Map** if Redis is unavailable. |
| **Socket.IO v4** | Real-time WebSocket communication |
| **JWT (jsonwebtoken)** | Authentication tokens (access + refresh) |
| **bcryptjs** | Password hashing (12 rounds) |
| **nodemailer** | Email sending (OTP, password reset) |
| **express-validator** | Request validation |
| **express-rate-limit** | Rate limiting |
| **helmet** | HTTP security headers |
| **hpp** | HTTP parameter pollution protection |
| **mongo-sanitize** | NoSQL injection prevention |
| **morgan** | HTTP request logging |
| **cookie-parser** | Cookie handling for refresh tokens |
| **uuid** | Unique request IDs in responses |
| **@socket.io/redis-adapter** | Horizontal scaling for Socket.IO |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite 6** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **react-hot-toast** | Toast notifications |
| **socket.io-client** | WebSocket client |

### Dev Server Proxy
Vite proxies all `/api` requests to `http://localhost:5000` so the frontend and backend can run on separate ports during development.

---

## 3. Folder Structure

```
CampusX/
├── server/                          # Express.js Backend
│   ├── server.js                    # Entry point — boots Express, MongoDB, Redis, Socket.IO, cron
│   ├── package.json                 # Backend dependencies
│   ├── .env                         # Environment variables (gitignored)
│   ├── .env.example                 # Template for env vars
│   ├── config/
│   │   ├── environment.js           # Centralized env config (dotenv → single object)
│   │   ├── database.js              # MongoDB connection (mongoose.connect)
│   │   ├── redis.js                 # Redis connection + in-memory fallback cache API
│   │   ├── colleges.json            # 15 pre-configured Indian colleges
│   │   ├── careerPathsData.js       # Career path definitions for AI recommendations
│   │   ├── interestsData.js         # Interest categories for onboarding
│   │   └── skillsData.js            # Skill categories for onboarding
│   ├── models/                      # 64 Mongoose schemas
│   ├── middleware/                   # 9 Express middlewares
│   ├── routes/                      # 15 route files
│   ├── controllers/                 # 15 controllers
│   ├── services/                    # 57 service/engine files (business logic)
│   ├── repositories/                # 18 data-access repositories
│   ├── validators/                  # 10 validation rule sets
│   ├── utils/                       # 4 utility modules
│   ├── seeds/                       # 3 seed scripts
│   └── tests/                       # 7 test files
│
├── client/                          # React/Vite Frontend
│   ├── vite.config.js               # Vite config with API proxy
│   ├── index.html                   # HTML entry
│   ├── package.json                 # Frontend dependencies
│   └── src/
│       ├── main.jsx                 # React entry point (ThemeProvider → App)
│       ├── App.jsx                  # Router + route guards + all routes
│       ├── api/
│       │   └── guardianApi.js       # Centralized Axios API client (269 lines, ~80 methods)
│       ├── context/
│       │   ├── AuthContext.jsx       # Auth state management (useReducer)
│       │   └── ThemeContext.jsx      # Dark/light theme toggle
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── PostCard.jsx
│       │   ├── PostDetailModal.jsx
│       │   ├── CreatePostModal.jsx
│       │   └── RecommendationPanel.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── OTPVerificationPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── ResetPasswordPage.jsx
│       │   ├── FeedPage.jsx
│       │   ├── ProfileDashboard.jsx
│       │   ├── SecurityDashboard.jsx
│       │   ├── RankForgeDashboard.jsx
│       │   ├── SafeVoiceDashboard.jsx
│       │   ├── BranchConnectDashboard.jsx
│       │   ├── CreatorBoostDashboard.jsx
│       │   ├── PulseNotifyDashboard.jsx
│       │   ├── admin/
│       │   │   └── AdminDashboard.jsx
│       │   └── onboarding/
│       │       ├── OnboardingWizard.jsx
│       │       └── steps/
│       │           ├── WelcomeStep.jsx
│       │           ├── CollegeStep.jsx
│       │           ├── BranchStep.jsx
│       │           ├── YearSemesterStep.jsx
│       │           ├── PersonalStep.jsx
│       │           ├── InterestStep.jsx
│       │           ├── SkillStep.jsx
│       │           └── CompletionStep.jsx
│       └── styles/
│           ├── index.css             # Global styles (~39KB)
│           └── dashboards.css        # Dashboard-specific styles
```

---

## 4. Architecture Overview

### Design Pattern: Layered Architecture

```
Client (React) → API (Axios) → Express Routes → Middleware Pipeline → Controllers → Services → Repositories → MongoDB
                                                                                         ↕
                                                                                    Redis Cache
                                                                                         ↕
                                                                                    Socket.IO (Real-time)
```

**Request Flow (step by step):**

1. **Client** makes an HTTP request via `guardianApi.js` (Axios instance).
2. **Axios Request Interceptor** attaches `Bearer <accessToken>` from localStorage.
3. **Vite Proxy** forwards `/api/*` to `http://localhost:5000`.
4. **Express Global Middleware** (in order):
   - `helmet()` — Security headers
   - `cors()` — CORS with credentials
   - `hpp()` — HTTP parameter pollution protection
   - `express.json()` — Parse JSON body (10KB limit)
   - `cookieParser()` — Parse cookies
   - `morgan()` — Request logging
   - `generalLimiter` — 100 req/15min per IP
   - `inputSanitizer` — NoSQL injection, XSS, prototype pollution prevention
   - `deviceTracker` — Extracts IP and user-agent → `req.deviceInfo`
5. **Route-level Middleware**:
   - `authenticate` — Verifies JWT, loads user, attaches `req.user`
   - `authorize('admin')` — Checks role (admin, moderator)
   - `authLimiter` / `otpLimiter` — Stricter rate limits on auth endpoints
   - `antiCheatGuard('like')` — Anti-abuse for engagement actions
   - Validators (express-validator rules)
6. **Controller** orchestrates the request, delegates to services.
7. **Service** contains business logic, calls repositories for data access.
8. **Repository** performs Mongoose queries.
9. **Response** sent back using `sendSuccess()` or `sendError()` with standardized format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "meta": {
    "timestamp": "2026-07-09T...",
    "requestId": "uuid-v4"
  }
}
```

10. **Axios Response Interceptor** handles 401 errors → auto-refreshes token using `POST /api/auth/refresh-token` → replays the original request.

---

## 5. The 8 AI Agents (Feature Modules)

Each "AI Agent" is a feature module with its own routes, controller, services, and models:

### Agent 1: Guardian AI (Authentication & Security)
- **Purpose**: Registration, login, OTP verification, password recovery, session management, trust scoring, fraud detection
- **Route prefix**: `/api/auth`, `/api/security`, `/api/admin`
- **Key Services**: `authService`, `sessionService`, `verificationService`, `trustScoreService`, `fraudDetectionService`, `riskAnalysisService`, `otpService`, `emailService`, `auditService`
- **Key Models**: `User`, `Session`, `LoginLog`, `SecurityLog`, `Device`, `VerificationRecord`, `TrustScore`

### Agent 2: ProfilePilot AI (Profile & Onboarding)
- **Purpose**: 8-step onboarding wizard, profile completion scoring, AI bio generation, career recommendations, skill/interest suggestions, career roadmaps
- **Route prefix**: `/api/onboarding`, `/api/profile`
- **Key Services**: `profileService`, `bioEngine`, `careerEngine`, `careerInsightsEngine`, `skillEngine`, `interestEngine`
- **Key Models**: `Profile`, `CareerRecommendation`, `LearningRoadmap`, `LearningProgress`

### Agent 3: FeedSense AI (Social Feed)
- **Purpose**: AI-ranked social feed with tabs (For You, Following, Branch, Trending, Projects, Internships, Events), post creation (9 types), likes, comments, saves, shares, polls, view tracking, spam detection, content quality scoring, hashtag extraction
- **Route prefix**: `/api/feed`
- **Key Services**: `feedService`, `feedRankingEngine`, `contentClassifier`, `qualityEngine`, `qualityScoringEngine`, `spamDetector`, `spamEngine`, `hashtagEngine`, `sentimentEngine`, `trendingEngine`, `postSummarizer`, `categoryEngine`, `recommendationEngine`
- **Key Models**: `Post`, `Comment`, `Like`, `Save`, `Share`, `View`, `Tag`, `FeedScore`, `TrendingData`, `ContentCategory`, `ContentAnalytics`, `Recommendation`

### Agent 4: RankForge AI (Gamification)
- **Purpose**: Points system, leaderboards (overall, branch, college, weekly, monthly), achievements, badges, reputation, ranking history, reward shop, Q&A helpful-marking, daily snapshot cron
- **Route prefix**: `/api/gamification`
- **Key Services**: `pointsService`, `leaderboardService`, `achievementService`, `badgeService`, `reputationService`, `rewardService`, `gamificationCron`, `antiCheatService`, `growthCalculator`
- **Key Models**: `UserPoint`, `UserReputation`, `UserAchievement`, `UserBadge`, `Achievement`, `Badge`, `LeaderboardSnapshot`, `RankingHistory`, `PointsLog`, `Reward`, `RewardTransaction`, `UserReward`, `GrowthMetrics`, `AntiCheatLog`

### Agent 5: SafeVoice AI (Anonymous Feedback)
- **Purpose**: Anonymous posting with identity hashing (SHA-256), toxicity detection, sentiment analysis, category classification, report → escalation → resolution pipeline, community health metrics
- **Route prefix**: `/api/anonymous`
- **Key Services**: `anonymousService`, `toxicityEngine`, `contentClassifier`
- **Key Models**: `AnonymousPost`, `Escalation`, `ModerationLog`, `TrustSafetyLog`, `CommunityHealthMetrics`

### Agent 6: BranchConnect AI (Collaboration)
- **Purpose**: Communities (create, join, leave, posts), events (create, register, attendance), mentorship (request, respond, sessions, feedback, AI mentor matching), project teams (create, invite, match, approve)
- **Route prefix**: `/api/collaboration`
- **Key Services**: `collaborationService`, `communityRecEngine`, `communityHealthEngine`, `mentorshipEngine`, `teamMatchingEngine`
- **Key Models**: `Community`, `CommunityMember`, `CommunityPost`, `CommunityRecommendation`, `Event`, `Mentorship`, `Project`, `ProjectTeam`, `TeamMatch`

### Agent 7: CreatorBoost AI (Creator Tools)
- **Purpose**: Project showcase, content posts (blogs, achievements), AI writing assistant, resource uploads, real-time engagement tracking (hover, duration), creator analytics dashboard
- **Route prefix**: `/api/creator`
- **Key Services**: `creatorService`, `contentHelperEngine`, `engagementEngine`
- **Key Models**: `ContentPost`, `Resource`, `EngagementMetric`, `ContentAnalytics`

### Agent 8: PulseNotify AI (Smart Notifications)
- **Purpose**: Notification inbox with priority scoring, preferences, activity tracking, timeline, career insights, internship matching, deadline reminders, profile completion reminders, session duration tracking, student analytics dashboard
- **Route prefix**: `/api/pulse`
- **Key Services**: `pulseAnalyticsService`, `pulseNotificationService`, `notificationPrioritizer`, `priorityEngine`, `opportunityEngine`, `internshipMatcher`, `reminderEngine`
- **Key Models**: `Notification`, `NotificationPreference`, `Activity`, `ActivityTimeline`, `UserActivity`, `UserAnalytics`, `CareerInsight`, `InternshipRecommendation`, `ReminderSchedule`

---

## 6. Server Entry Point (server.js)

The file `server/server.js` does the following on startup:

1. **Import & Configure Express** with all middleware
2. **Mount 15 Route Files** onto their URL prefixes
3. **Add 404 catch-all** and **global error handler**
4. **`startServer()` async function**:
   - Connect to MongoDB (`mongoose.connect`)
   - Connect to Redis (graceful — won't crash if unavailable)
   - Seed admin user if not exists (`admin@campusx.edu` / `Admin@CampusX2026`)
   - Create HTTP server from Express app
   - Initialize Socket.IO on the HTTP server (with Redis adapter if available)
   - Attach `io` to `app.set('io', io)` for access in controllers
   - Start **TrendingEngine** cron (initial + every 1 hour)
   - Start **GamificationCron** scheduler (daily snapshots)
   - Listen on port 5000

---

## 7. Configuration Layer

### `config/environment.js`
Centralizes all env variables into a single exported object:
- `nodeEnv`, `port`, `isDev`, `isProd`
- `mongoUri` — defaults to `mongodb://localhost:27017/campusx`
- `redis` — host, port, password
- `jwt` — accessSecret, refreshSecret, accessExpiry (15m), refreshExpiry (7d), refreshExpiryRemember (30d)
- `csrfSecret`
- `smtp` — host, port, user, pass, from
- `otp` — expiryMinutes (10), length (6)
- `rateLimit` — windowMs (15min), maxRequests (100), authMax (5)
- `security` — bcryptRounds (12), maxLoginAttempts (5), lockTimeMinutes (15), maxSessionsPerUser (5)
- `clientUrl` — `http://localhost:5173`
- `admin` — email, password

### `config/database.js`
Connects to MongoDB with connection pool (maxPoolSize: 10) and auto-reconnect. Exits process on connection failure.

### `config/redis.js`
- Creates an `ioredis` client with lazy connect and retry strategy (3 retries).
- If Redis is unavailable, falls back to an **in-memory `Map`** with TTL support.
- Exports a unified `cache` API with methods: `get`, `set`, `del`, `incr`, `expire`, `ttl`, `isAvailable()`.
- Every service uses `cache` instead of raw Redis, so the app works without Redis.

### `config/colleges.json`
15 pre-configured Indian colleges with their domains, branches, and semester ranges. Used for verification during registration.

### `config/careerPathsData.js`, `interestsData.js`, `skillsData.js`
Static data used by the ProfilePilot AI for career recommendations, interest suggestions, and skill suggestions during onboarding and profile management.

---

## 8. Database Models (64 Mongoose Models)

### Core Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | email, passwordHash (select:false), firstName, lastName, rollNumber, college, branch, semester, role (student/admin/moderator), status (pending/active/suspended/blocked/deactivated), emailVerified, isVerified, riskLevel (low/medium/high), failedLoginAttempts, lockedUntil, lastLoginAt, lastLoginIp, registrationIp, onboardingCompleted | Core user account |
| **Profile** | userId (ref User), username, bio, avatarUrl, skills[], interests[], projects[], certifications[], achievements[], careerGoals[], preferredDomains[], internshipInterests[], higherEducationGoals, generatedBio, profileCompletionScore (0-100), profileLevel (beginner/intermediate/advanced/campus_pro), recommendedCareerPaths[], onboardingStep (1-8), onboardingCompleted, following[], followers[] | Extended user profile |
| **Post** | authorId (ref User), type (project/achievement/resource/event/internship/discussion/question/poll/announcement), title, content, mediaUrls[], metadata (Mixed — stores type-specific data like poll options, event dates, github links), aiSummary, hashtags[], qualityScore (0-100), spamScore (0-100), isSpam, reports[], isReported, viewsCount, likesCount, commentsCount, sharesCount, savesCount | Social feed posts |
| **Session** | userId, token, deviceInfo, ipAddress, expiresAt, isActive | Active login sessions |

### Engagement Models
`Comment`, `Like`, `Save`, `Share`, `View` — Each has a userId, postId, and relevant metadata.

### Gamification Models
`UserPoint`, `UserReputation`, `UserAchievement`, `UserBadge`, `Achievement`, `Badge`, `LeaderboardSnapshot`, `RankingHistory`, `PointsLog`, `Reward`, `RewardTransaction`, `UserReward`, `GrowthMetrics`, `AntiCheatLog`

### Anonymous/Moderation Models
`AnonymousPost`, `Escalation`, `ModerationLog`, `TrustSafetyLog`, `CommunityHealthMetrics`

### Collaboration Models
`Community`, `CommunityMember`, `CommunityPost`, `CommunityRecommendation`, `Event`, `Mentorship`, `Project`, `ProjectTeam`, `TeamMatch`

### Creator Models
`ContentPost`, `Resource`, `EngagementMetric`, `ContentAnalytics`

### Notification/Analytics Models
`Notification`, `NotificationPreference`, `Activity`, `ActivityTimeline`, `UserActivity`, `UserAnalytics`, `CareerInsight`, `InternshipRecommendation`, `ReminderSchedule`

### Security Models
`LoginLog`, `SecurityLog`, `Device`, `VerificationRecord`, `TrustScore`

### Other Models
`Tag`, `FeedScore`, `TrendingData`, `ContentCategory`, `Recommendation`, `Report`, `CareerRecommendation`, `LearningRoadmap`, `LearningProgress`

---

## 9. Middleware Pipeline

### Global Middleware (applied to every request, in order):

1. **`helmet()`** — Sets security HTTP headers (CSP, X-Frame-Options, etc.). CSP disabled in dev.
2. **`cors()`** — Allows `http://localhost:5173`, credentials: true, methods: GET/POST/PUT/PATCH/DELETE/OPTIONS.
3. **`hpp()`** — Prevents HTTP parameter pollution attacks.
4. **`express.json({ limit: '10kb' })`** — JSON body parser with 10KB limit.
5. **`express.urlencoded({ extended: true, limit: '10kb' })`** — URL-encoded body parser.
6. **`cookieParser()`** — Parses cookies (used for refresh token in httpOnly cookie).
7. **`morgan()`** — HTTP request logger ('dev' in development, 'combined' in production).
8. **`generalLimiter`** — Rate limits all requests to 100/15min per IP.
9. **`inputSanitizer`** — Deep-sanitizes `req.body`, `req.query`, `req.params`:
   - Strips MongoDB operators (`$gt`, `$ne`, etc.) via `mongo-sanitize`
   - HTML-encodes strings (`<`, `>`, `"`, `'`, `&`, `/`)
   - Removes `__proto__`, `constructor`, `prototype` keys (prototype pollution prevention)
10. **`deviceTracker`** — Extracts IP address and user-agent from headers, attaches as `req.deviceInfo`.

### Route-Level Middleware:

11. **`authenticate`** — Verifies JWT access token from `Authorization: Bearer <token>` header. Loads user from DB. Blocks if user is `blocked` or `deactivated`. Attaches `req.user = { id, email, role, status }`.
12. **`optionalAuth`** — Same as `authenticate` but doesn't block if no token is present.
13. **`authorize(...roles)`** — Role-based access control. E.g., `authorize('admin')` blocks non-admin users with 403.
14. **`authLimiter`** — 5 requests/15min for auth endpoints (login, register).
15. **`otpLimiter`** — 3 OTP requests/10min per IP+email combo.
16. **`anonymousRateLimiter`** — 10 posts/reports per 10min per IP. Logs rate limit violations to trust & safety logs.
17. **`antiCheatGuard(action)`** — Anti-abuse middleware for engagement actions (like, comment, save):
    - **Self-interaction block**: Skips gamification points if user interacts with their own post.
    - **Sybil/IP cohort detection**: Skips gamification if the interacting user and post author share the same IP.
    - **Velocity limiting**: Uses Redis sliding window — max 10 likes/5min, max 20 comments/10min.
    - Sets `req.skipGamification = true` when abuse detected (but still allows the action to proceed — "fail-open").

### Error Handler (last middleware):

18. **`errorHandler`** — Global error handler. Maps Mongoose ValidationError → 422, duplicate key → 409, JWT errors → 401. Returns standardized error response in production (hides stack traces).

### CSRF Protection (available but not globally applied):
- **`generateCSRFToken`** — Generates a random 32-byte token, sets it as a cookie.
- **`validateCSRFToken`** — Validates double-submit cookie pattern. **Skipped in development** for API testing convenience.

---

## 10. Utility Layer

### `utils/tokenUtils.js`
- `generateAccessToken(payload)` — Signs JWT with accessSecret, 15min expiry, issuer: `campusx-guardian-ai`.
- `generateRefreshToken(payload, rememberMe)` — Signs JWT with refreshSecret, 7d or 30d expiry.
- `verifyAccessToken(token)` — Returns `{ valid, decoded }` or `{ valid: false, error }`.
- `verifyRefreshToken(token)` — Same for refresh tokens.
- `getExpiryDate(duration)` — Converts JWT duration strings like '15m', '7d' to Date objects.

### `utils/passwordUtils.js`
- `hashPassword(password)` — bcrypt hash with 12 rounds.
- `comparePassword(password, hash)` — bcrypt compare.
- `validatePasswordStrength(password)` — Returns `{ valid, errors[], strength (0-4), label }`. Requires 8+ chars, uppercase, lowercase, digit, special char.

### `utils/responseUtils.js`
- `sendSuccess(res, { statusCode, message, data })` — Standardized success response with UUID requestId.
- `sendError(res, { statusCode, message, errors })` — Standardized error response.
- `sendValidationError(res, errors)` — 422 response with field-level validation errors.

### `utils/constants.js`
Defines enums for: `USER_STATUS`, `ROLES`, `RISK_LEVELS`, `VERIFICATION_STATUS`, `TRUST_WEIGHTS`, `SECURITY_EVENTS`, `LOGIN_ACTIONS`, `SEVERITY`, `COOKIES`, `RATE_LIMIT_KEYS`.

---

## 11. Validators

Each validator file exports express-validator chains. They are applied as middleware before controllers.

| File | Validates |
|------|----------|
| `authValidators.js` | register (email, password, firstName, lastName, college, branch, semester), login (email, password) |
| `verificationValidators.js` | OTP verification (email, otp), resend OTP (email) |
| `recoveryValidators.js` | forgot password (email), reset password (email, otp, newPassword) |
| `profileValidators.js` | onboarding steps, profile updates (bio, skills, interests, projects, etc.) |
| `feedValidators.js` | post creation (type, content, title), comment creation, engagement (postId), view tracking, report (reason) |
| `gamificationValidator.js` | leaderboard queries, points updates, reward operations |
| `anonymousValidator.js` | anonymous post creation, reporting, moderation, escalation resolution |
| `collaborationValidator.js` | community creation, post creation, event creation, mentorship requests, team creation |
| `creatorValidator.js` | project publishing, content posts, resource uploads, engagement tracking |
| `pulseValidator.js` | preference updates, activity tracking, session logging, internship status updates |

---

## 12. Repository Layer

Repositories abstract Mongoose queries. Controllers and services never call Mongoose directly; they go through repositories.

| Repository | Purpose |
|-----------|---------|
| `achievementRepository.js` | CRUD for achievements, user-achievement links |
| `activityRepository.js` | Activity logging and retrieval |
| `analyticsRepository.js` | Aggregation queries for analytics dashboards |
| `anonymousPostRepository.js` | Anonymous post CRUD with hashed identity management |
| `antiCheatRepository.js` | Anti-cheat log CRUD and query |
| `badgeRepository.js` | Badge definitions and user-badge assignments |
| `careerRepository.js` | Career recommendations and learning roadmaps |
| `communityRepository.js` | Community CRUD, membership, posts |
| `contentRepository.js` | Feed posts, comments, interactions (like/save/share/view) — the largest repository |
| `growthRepository.js` | Growth metrics tracking |
| `leaderboardRepository.js` | Leaderboard snapshot storage and retrieval |
| `mentorshipRepository.js` | Mentorship relationships and sessions |
| `moderationRepository.js` | Moderation logs, trust & safety events |
| `notificationRepository.js` | Notification CRUD and read status |
| `pointsRepository.js` | Points balance, transaction logs, aggregation |
| `projectRepository.js` | Project and team CRUD |
| `reportRepository.js` | Report management |
| `reputationRepository.js` | User reputation scores and history |

---

## 13. Service Layer (57 Services/Engines)

The service layer is the **brain** of the application. Services implement all business logic and AI-like algorithms.

### Authentication & Security Services
| Service | What it does |
|---------|-------------|
| `authService.js` | Registration flow (validate college, check duplicates, hash password, create user, send OTP), login flow (check lock, verify password, create session, generate tokens, fraud checks), token refresh, logout |
| `sessionService.js` | Create/revoke sessions, enforce max sessions per user, bulk logout |
| `verificationService.js` | OTP verification, roll number format validation, branch matching against college data |
| `otpService.js` | Generate 6-digit OTP, store in Redis/cache with TTL, validate on submission |
| `emailService.js` | Send OTP emails, password reset emails, welcome emails via nodemailer/SMTP |
| `trustScoreService.js` | Calculate 0-100 trust score across 7 weighted factors (email verified, roll number, branch match, semester, account age, clean record, device trust) |
| `fraudDetectionService.js` | Detect disposable emails, IP clustering, brute force patterns, suspicious registrations |
| `riskAnalysisService.js` | Classify users as low/medium/high risk based on trust score and behavior patterns |
| `auditService.js` | Log login events, security events with IP, device, timestamp |

### Profile & Career Services
| Service | What it does |
|---------|-------------|
| `profileService.js` | Profile CRUD, completion score calculation, level assignment |
| `bioEngine.js` | AI-style bio generation based on skills, interests, career goals |
| `careerEngine.js` | Career path recommendations based on branch, skills, interests |
| `careerInsightsEngine.js` | Detailed career insights with learning paths |
| `skillEngine.js` | Skill recommendations based on branch and existing skills |
| `interestEngine.js` | Interest suggestions based on branch and career goals |
| `collegeService.js` | College validation, branch/semester lookup from colleges.json |

### Feed & Content Services
| Service | What it does |
|---------|-------------|
| `feedService.js` | Feed assembly for each tab, pagination, content mixing, personalization |
| `feedRankingEngine.js` | Ranks posts using a scoring algorithm: recency, engagement rate, quality score, author reputation, personalization signals (branch match, interest match, following) |
| `contentClassifier.js` | Classifies post content into categories, detects type-specific attributes |
| `qualityEngine.js` | Scores post quality (0-100) based on length, formatting, media, engagement |
| `qualityScoringEngine.js` | Advanced quality scoring with sentiment and readability |
| `spamDetector.js` | Detects spam via keyword patterns, link density, repetition, user behavior |
| `spamEngine.js` | Spam scoring and auto-flagging |
| `hashtagEngine.js` | Extracts hashtags from post content, normalizes and tracks |
| `sentimentEngine.js` | Analyzes text sentiment (positive/negative/neutral) using keyword matching |
| `trendingEngine.js` | Calculates trending posts, hashtags, and topics hourly via weighted scoring |
| `postSummarizer.js` | Generates AI-style post summaries from content |
| `categoryEngine.js` | Manages content categories and classification |
| `recommendationEngine.js` | Personalized content recommendations based on user profile and behavior |

### Gamification Services
| Service | What it does |
|---------|-------------|
| `pointsService.js` | Award/deduct points for actions (post, like, comment, etc.), transaction logging |
| `leaderboardService.js` | Calculate and cache leaderboards (overall, branch, college, weekly, monthly) |
| `achievementService.js` | Check and award achievements based on milestones |
| `badgeService.js` | Badge definitions, assignment, rarity calculation |
| `reputationService.js` | Multi-factor reputation scoring |
| `rewardService.js` | Reward shop — redeem points for rewards, admin fulfill/refund |
| `gamificationCron.js` | Daily snapshot scheduler — takes leaderboard snapshots, processes ranking history, resets weekly counters |
| `antiCheatService.js` | Detailed anti-cheat logging and analysis |
| `growthCalculator.js` | Calculate user growth metrics over time |

### Anonymous/Safety Services
| Service | What it does |
|---------|-------------|
| `anonymousService.js` | Anonymous post creation with SHA-256 identity hashing, feed retrieval, reporting pipeline, escalation handling |
| `toxicityEngine.js` | Keyword-based toxicity scoring, auto-flagging high-toxicity content |

### Collaboration Services
| Service | What it does |
|---------|-------------|
| `collaborationService.js` | Orchestrates communities, events, mentorship, and team operations |
| `communityRecEngine.js` | Recommends communities based on user interests and branch |
| `communityHealthEngine.js` | Calculates community health metrics (engagement, growth, toxicity) |
| `mentorshipEngine.js` | AI mentor matching based on skills, experience, rating |
| `teamMatchingEngine.js` | Team matching algorithm based on complementary skills and availability |

### Creator Services
| Service | What it does |
|---------|-------------|
| `creatorService.js` | Project/content CRUD, analytics aggregation |
| `contentHelperEngine.js` | AI writing assistant — generates title suggestions, content improvements, SEO tips |
| `engagementEngine.js` | Tracks detailed engagement metrics (hover time, scroll depth, read duration) |

### Notification Services
| Service | What it does |
|---------|-------------|
| `pulseAnalyticsService.js` | Student analytics dashboard — aggregates all user activity |
| `pulseNotificationService.js` | Creates and sends notifications via Socket.IO rooms |
| `notificationPrioritizer.js` | Scores notification priority for sorting |
| `priorityEngine.js` | Advanced priority calculation based on user preferences |
| `opportunityEngine.js` | Surfaces relevant career opportunities |
| `internshipMatcher.js` | Matches students to internships based on skills, interests, branch |
| `reminderEngine.js` | Profile completion reminders, deadline reminders |

### Real-Time Service
| Service | What it does |
|---------|-------------|
| `socketService.js` | Socket.IO initialization, authentication, room management, presence tracking, real-time broadcast functions |

---

## 14. All API Routes (Complete Reference)

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/auth/register` | ❌ | authLimiter (5/15min) | Register new student. Validates college, hashes password, sends OTP email. |
| POST | `/api/auth/login` | ❌ | authLimiter (5/15min) | Login with email/password. Returns accessToken + sets refresh cookie. |
| POST | `/api/auth/refresh-token` | ❌ | — | Refresh access token using httpOnly refresh cookie. |
| POST | `/api/auth/logout` | ✅ | — | Logout current session. Revokes refresh token. |
| POST | `/api/auth/logout-all` | ✅ | — | Logout all sessions across all devices. |
| POST | `/api/auth/verify-otp` | ❌ | otpLimiter (3/10min) | Verify email OTP code. Activates account. |
| POST | `/api/auth/resend-otp` | ❌ | otpLimiter (3/10min) | Resend OTP to email. |
| POST | `/api/auth/forgot-password` | ❌ | authLimiter | Send password reset OTP to email. |
| POST | `/api/auth/reset-password` | ❌ | authLimiter | Reset password using email + OTP + new password. |

### Security (`/api/security`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/security/status` | ✅ | Get user's security status and risk overview. |
| GET | `/api/security/login-history` | ✅ | Paginated login audit trail (IP, device, timestamp, action). |
| GET | `/api/security/trust-score` | ✅ | Detailed trust score breakdown (7 factors). |
| GET | `/api/security/sessions` | ✅ | List all active sessions for the user. |
| DELETE | `/api/security/sessions/:id` | ✅ | Revoke a specific session (remote logout). |

### Profile (`/api/profile`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | ✅ | Get basic user profile (from User model). |
| GET | `/api/profile/me` | ✅ | Get full profile (Profile model — skills, interests, projects, etc.). |
| PUT | `/api/profile/me` | ✅ | Update profile fields. Recalculates completion score. |
| GET | `/api/profile/completion` | ✅ | Get profile completion score and missing sections. |
| GET | `/api/profile/recommendations` | ✅ | Get AI career recommendations based on profile. |
| POST | `/api/profile/generate-bio` | ✅ | Generate an AI-style bio from skills/interests/goals. |
| GET | `/api/profile/recommended-skills` | ✅ | Get AI-recommended skills based on branch and existing skills. |
| GET | `/api/profile/recommended-interests` | ✅ | Get AI-recommended interests based on branch and goals. |
| GET | `/api/profile/career-roadmap` | ✅ | Get a detailed career roadmap for a specific goal. |

### Onboarding (`/api/onboarding`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/onboarding/status` | ✅ | Get current onboarding step and completion status. |
| POST | `/api/onboarding/step/:step` | ✅ | Save data for a specific onboarding step (1-8). |
| POST | `/api/onboarding/complete` | ✅ | Mark onboarding as complete. Triggers career recommendations. |
| GET | `/api/onboarding/suggestions/interests` | ✅ | Get interest suggestions for onboarding. |
| GET | `/api/onboarding/suggestions/skills` | ✅ | Get skill suggestions for onboarding. |

### Feed (`/api/feed`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feed/:tab` | ✅ | Get feed posts for a specific tab. Tab must be one of: `for-you`, `following`, `branch`, `trending`, `projects`, `internships`, `events`. Supports `?page=1&limit=10`. |
| POST | `/api/feed/posts` | ✅ | Create a new post (9 types supported). Auto-runs spam detection, quality scoring, hashtag extraction, AI summary generation. Awards gamification points. |
| GET | `/api/feed/posts/:postId/comments` | ✅ | Get paginated comments for a post. |
| POST | `/api/feed/like` | ✅ | Toggle like on a post. Body: `{ postId }`. Anti-cheat guarded. Awards points (unless skipped). |
| POST | `/api/feed/comment` | ✅ | Add a comment. Body: `{ postId, content }`. Anti-cheat guarded. Awards points. |
| POST | `/api/feed/save` | ✅ | Toggle save on a post. Body: `{ postId }`. Anti-cheat guarded. |
| POST | `/api/feed/share` | ✅ | Register a share. Body: `{ postId, platform }`. |
| POST | `/api/feed/view` | ✅ | Track a post view. Body: `{ postId, watchTime }`. |
| POST | `/api/feed/report` | ✅ | Report a post. Body: `{ postId, reason }`. |
| POST | `/api/feed/poll/vote` | ✅ | Vote on a poll. Body: `{ postId, optionIndex }`. |
| POST | `/api/feed/follow/:targetUserId` | ✅ | Follow/unfollow a user. |
| GET | `/api/feed/recommendations` | ✅ | Get personalized content recommendations. |
| GET | `/api/feed/opportunities` | ✅ | Get career opportunities relevant to user. |
| GET | `/api/feed/creator-analytics` | ✅ | Get analytics for the user's own posts. |
| GET | `/api/feed/notifications` | ✅ | Get user's notifications. |
| GET | `/api/feed/notifications/unread-count` | ✅ | Get count of unread notifications. |
| POST | `/api/feed/notifications/read` | ✅ | Mark notifications as read. |

### Gamification (`/api/gamification`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gamification/leaderboard` | ✅ | Overall leaderboard. `?page=1&limit=50`. |
| GET | `/api/gamification/leaderboard/branch` | ✅ | Branch-specific leaderboard. `?branch=CSE&page=1&limit=50`. |
| GET | `/api/gamification/leaderboard/college` | ✅ | College-specific leaderboard. `?college=IIT Delhi&page=1&limit=50`. |
| GET | `/api/gamification/leaderboard/weekly` | ✅ | Weekly leaderboard. |
| GET | `/api/gamification/leaderboard/monthly` | ✅ | Monthly leaderboard. |
| GET | `/api/gamification/achievements` | ✅ | Get all achievements with user's unlock status. |
| GET | `/api/gamification/badges` | ✅ | Get all badges with user's earned status. |
| GET | `/api/gamification/reputation` | ✅ | Get user's multi-factor reputation breakdown. |
| GET | `/api/gamification/ranking/history` | ✅ | Get ranking history over time. `?days=30`. |
| POST | `/api/gamification/comments/:commentId/helpful` | ✅ | Mark a comment as helpful (Q&A feature). Awards points to commenter. |
| GET | `/api/gamification/rewards` | ✅ | List available rewards in the reward shop. |
| POST | `/api/gamification/rewards/redeem` | ✅ | Redeem a reward. Body: `{ rewardId }`. Deducts points. |
| GET | `/api/gamification/rewards/history` | ✅ | Get user's reward redemption history. |
| POST | `/api/gamification/rewards/admin/fulfill` | 🔒 Admin/Mod | Mark a redeemed reward as fulfilled. Body: `{ transactionId, notes }`. |
| POST | `/api/gamification/rewards/admin/refund` | 🔒 Admin | Refund a reward transaction. Body: `{ transactionId, reason }`. |
| POST | `/api/gamification/points/update` | 🔒 Admin | Manually adjust user points. Body: `{ userId, points, reason }`. |

### Anonymous / SafeVoice (`/api/anonymous`)

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/anonymous/post` | ✅ | anonymousRateLimiter | Create anonymous post. Identity hashed with SHA-256. Toxicity checked. Body: `{ content, type }`. |
| GET | `/api/anonymous/feed` | ✅ | — | Get anonymous feed. Supports query params for filtering/pagination. |
| POST | `/api/anonymous/report` | ✅ | anonymousRateLimiter | Report an anonymous post. Body: `{ postId, reason, details }`. |
| GET | `/api/anonymous/trending` | ✅ | — | Get trending anonymous topics. |
| GET | `/api/anonymous/categories` | ✅ | — | Get anonymous post categories. |
| GET | `/api/anonymous/sentiment` | ✅ | — | Get overall sentiment analysis of anonymous posts. |
| GET | `/api/anonymous/community-health` | ✅ | — | Get community health metrics. |
| GET | `/api/anonymous/analytics` | 🔒 Admin | — | Get anonymous posting analytics. |
| POST | `/api/anonymous/admin/moderate` | 🔒 Admin/Mod | — | Moderate a post. Body: `{ postId, status, reason }`. |
| GET | `/api/anonymous/admin/reports` | 🔒 Admin/Mod | — | Get open reports for review. |
| GET | `/api/anonymous/admin/escalations` | 🔒 Admin/Mod | — | Get pending escalations. |
| POST | `/api/anonymous/admin/escalations/resolve` | 🔒 Admin | — | Resolve an escalation. Body: `{ escalationId, notes }`. |

### Collaboration / BranchConnect (`/api/collaboration`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/collaboration/communities` | ✅ | Create a new community. |
| POST | `/api/collaboration/communities/:communityId/join` | ✅ | Join a community. |
| POST | `/api/collaboration/communities/:communityId/leave` | ✅ | Leave a community. |
| GET | `/api/collaboration/communities/recommended` | ✅ | Get AI-recommended communities. |
| POST | `/api/collaboration/communities/:communityId/posts` | ✅ | Create a post in a community. |
| GET | `/api/collaboration/communities/:communityId/posts` | ✅ | Get community posts (paginated). |
| POST | `/api/collaboration/events` | ✅ | Create a new event. |
| POST | `/api/collaboration/events/:eventId/register` | ✅ | Register for an event. |
| GET | `/api/collaboration/events` | ✅ | List events (supports query filters). |
| POST | `/api/collaboration/events/:eventId/attendance` | ✅ | Mark attendance at an event. |
| POST | `/api/collaboration/mentorship/request` | ✅ | Request mentorship from a user. |
| POST | `/api/collaboration/mentorship/:mentorshipId/respond` | ✅ | Accept or decline mentorship request. |
| POST | `/api/collaboration/mentorship/:mentorshipId/sessions` | ✅ | Schedule a mentorship session. |
| POST | `/api/collaboration/mentorship/:mentorshipId/sessions/:sessionId/complete` | ✅ | Mark a session as complete. |
| POST | `/api/collaboration/mentorship/:mentorshipId/feedback` | ✅ | Submit feedback for mentorship. |
| GET | `/api/collaboration/mentorship` | ✅ | Get user's mentorships. `?role=mentor&status=active`. |
| GET | `/api/collaboration/mentorship/suggested-mentors` | ✅ | Get AI-suggested mentors. |
| POST | `/api/collaboration/teams` | ✅ | Create a project team. |
| GET | `/api/collaboration/teams/matches` | ✅ | Get AI-matched teams. `?type=team`. |
| POST | `/api/collaboration/teams/:teamId/member` | ✅ | Invite or request to join team. |
| POST | `/api/collaboration/teams/:teamId/respond` | ✅ | Accept/decline team invitation. |
| POST | `/api/collaboration/teams/:teamId/approve` | ✅ | Approve a join request (team owner). |

### Creator / CreatorBoost (`/api/creator`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/creator/projects` | ✅ | Publish a project. |
| GET | `/api/creator/projects/:projectId` | ✅ | Get project details. |
| GET | `/api/creator/projects` | ✅ | List user's projects. |
| POST | `/api/creator/posts` | ✅ | Publish a content post (blog, achievement, etc.). |
| GET | `/api/creator/posts/:postId` | ✅ | Get a content post. |
| GET | `/api/creator/posts` | ✅ | List content posts. |
| POST | `/api/creator/posts/:postId/like` | ✅ | Like a content post. |
| POST | `/api/creator/helper/suggestions` | ✅ | Get AI writing suggestions. Body: `{ title, content, type }`. |
| POST | `/api/creator/resources` | ✅ | Upload a resource. |
| GET | `/api/creator/resources/:resourceId/download` | ✅ | Download a resource. |
| GET | `/api/creator/resources` | ✅ | List resources. |
| POST | `/api/creator/analytics/track` | ✅ | Track engagement metrics (hover, duration). |
| GET | `/api/creator/analytics/dashboard` | ✅ | Get creator analytics dashboard data. |
| GET | `/api/creator/analytics/post/:postId` | ✅ | Get detailed analytics for a specific post. |

### PulseNotify (`/api/pulse`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pulse/notifications` | ✅ | Get pulse notifications. |
| POST | `/api/pulse/notifications/:notificationId/read` | ✅ | Mark a notification as read. |
| POST | `/api/pulse/notifications/read-all` | ✅ | Mark all notifications as read. |
| GET | `/api/pulse/preferences` | ✅ | Get notification preferences. |
| PUT | `/api/pulse/preferences` | ✅ | Update notification preferences. |
| POST | `/api/pulse/activity` | ✅ | Track user activity. Body: `{ action, details }`. |
| GET | `/api/pulse/timeline` | ✅ | Get activity timeline. |
| POST | `/api/pulse/career/insights` | ✅ | Trigger career insights generation. |
| GET | `/api/pulse/career/opportunities` | ✅ | Get internship recommendations. |
| PUT | `/api/pulse/career/opportunities/:recommendationId` | ✅ | Update internship status (applied, saved, etc.). |
| GET | `/api/pulse/reminders` | ✅ | Get active reminders. |
| POST | `/api/pulse/reminders/trigger` | ✅ | Trigger reminder evaluation. |
| POST | `/api/pulse/session` | ✅ | Log session duration. Body: `{ durationMs }`. |
| GET | `/api/pulse/dashboard` | ✅ | Get student analytics dashboard. |

### Admin (`/api/admin`) — All require `admin` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users with pagination and filters. |
| GET | `/api/admin/users/:id` | Get detailed user information. |
| PATCH | `/api/admin/users/:id/block` | Block/unblock a user. |
| PATCH | `/api/admin/users/:id/suspend` | Suspend/unsuspend a user. |
| GET | `/api/admin/fraud-alerts` | Get fraud alerts and suspicious activity. |
| GET | `/api/admin/security-logs` | Get security event logs. |
| GET | `/api/admin/stats` | Get dashboard stats (user counts, registrations, etc.). |
| GET | `/api/admin/profile-analytics` | ProfilePilot analytics (completion rates, levels). |
| GET | `/api/admin/skill-trends` | Trending skills across the platform. |
| GET | `/api/admin/interest-trends` | Trending interests across the platform. |
| GET | `/api/admin/feed/reports` | Get reported posts for review. |
| DELETE | `/api/admin/feed/posts/:postId` | Delete a post (admin moderation). |
| POST | `/api/admin/feed/posts/:postId/dismiss` | Dismiss a report on a post. |
| GET | `/api/admin/feed/spam` | Get spam-flagged posts. |
| GET | `/api/admin/feed/performance` | Get feed performance analytics. |

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Health check. Returns `{ success: true, message: "Guardian AI is operational" }`. |

---

## 15. Real-Time System (Socket.IO)

### Architecture
- **Transport**: WebSocket (Socket.IO v4)
- **Horizontal Scaling**: Redis Pub/Sub adapter (if Redis is available)
- **Authentication**: JWT token verified in Socket.IO middleware
- **Rate Limiting**: Custom per-socket rate limiter (30 events/10 seconds; auto-disconnect at 45+)

### Socket Authentication Flow
1. Client connects with `{ auth: { token: accessToken } }`
2. Socket middleware verifies JWT
3. Socket is assigned to rooms based on user data:
   - `user:{userId}` — Personal notification channel
   - `branch:{branchName}` — Branch community room
   - `college:{collegeName}` — College room
   - `followers:{userId}` — For each user they follow

### Client-to-Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join-post-room` | `postId` | Subscribe to real-time updates for a specific post |
| `leave-post-room` | `postId` | Unsubscribe from a post's updates |
| `subscribe-to-user` | `targetUserId` | Subscribe to a user's activity (follow) |
| `unsubscribe-from-user` | `targetUserId` | Unsubscribe from a user's activity (unfollow) |

### Server-to-Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `engagement-update` | `{ postId, likesCount, commentsCount, ... }` | Real-time engagement counter updates |
| `new-post` | `{ postId, type, authorName, summary, title }` | New post notification (global) |
| `new-post-branch` | Same as above | New post in the user's branch |
| `new-post-follower` | Same as above | New post from someone the user follows |
| `trending-update` | `{ trendingPosts }` | Updated trending posts list |
| `presence-update` | `{ userId, status, lastActive }` | User online/offline status |
| `activity-stream` | `{ userId, action, targetId, metadata }` | Real-time activity feed |
| `notification` | `{ type, title, message, ... }` | Push notification |
| `abuse-warning` | `{ message }` | Rate limit warning |

### Presence System
- Uses Redis sets (`presence:active_sockets:{userId}`) to track multi-tab/multi-device connections
- Falls back to local `Map` if Redis is unavailable
- 5-second debounce before setting user as offline (prevents flickering during page navigation)
- Broadcasts `presence-update` events to all connected clients

---

## 16. Cron Jobs & Background Tasks

### Trending Engine (Hourly)
- **File**: `services/trendingEngine.js`
- **Schedule**: Runs once on startup + every 60 minutes via `setInterval`
- **What it does**: Calculates trending posts, hashtags, and topics using weighted scoring (engagement velocity, recency, quality)

### Gamification Daily Snapshot
- **File**: `services/gamificationCron.js`
- **Schedule**: Daily via the `startScheduler()` function
- **What it does**: Takes daily leaderboard snapshots, processes ranking history, detects rank changes, awards streak badges, resets weekly/monthly counters at appropriate intervals

---

## 17. Client-Side Architecture

### Entry Point
`main.jsx` → wraps the app in `<React.StrictMode>`, `<ThemeProvider>`, then renders `<App />`.

### App.jsx — Route Configuration
The app uses **4 types of route guards**:

1. **`PublicRoute`**: For login/register pages. If user is already authenticated, redirects to `/dashboard/feed` (or `/onboarding` if not completed).
2. **`ProtectedRoute`**: Requires authentication. Redirects to `/login` if not authenticated. Supports `adminOnly` prop.
3. **`OnboardingGuard`**: Requires authentication. Redirects to `/dashboard/profile` if onboarding is already completed.
4. **`SmartRedirect`**: Auto-redirects based on auth state:
   - Not authenticated → `/login`
   - Not onboarded → `/onboarding`
   - Otherwise → `/dashboard/feed`

### Routes

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/login` | LoginPage | PublicRoute | Email/password login |
| `/register` | RegisterPage | PublicRoute | Student registration form |
| `/verify-otp` | OTPVerificationPage | — | 6-digit OTP verification |
| `/forgot-password` | ForgotPasswordPage | PublicRoute | Request password reset |
| `/reset-password` | ResetPasswordPage | PublicRoute | Reset password with OTP |
| `/onboarding` | OnboardingWizard | OnboardingGuard | 8-step onboarding wizard |
| `/dashboard/feed` | FeedPage | ProtectedRoute | Main social feed (default landing page) |
| `/dashboard/profile` | ProfileDashboard | ProtectedRoute | ProfilePilot AI dashboard |
| `/dashboard/security` | SecurityDashboard | ProtectedRoute | Security & sessions dashboard |
| `/dashboard/rankforge` | RankForgeDashboard | ProtectedRoute | Gamification dashboard |
| `/dashboard/safevoice` | SafeVoiceDashboard | ProtectedRoute | Anonymous feedback dashboard |
| `/dashboard/branchconnect` | BranchConnectDashboard | ProtectedRoute | Collaboration dashboard |
| `/dashboard/creatorboost` | CreatorBoostDashboard | ProtectedRoute | Creator tools dashboard |
| `/dashboard/pulsenotify` | PulseNotifyDashboard | ProtectedRoute | Smart notifications dashboard |
| `/admin` | AdminDashboard | ProtectedRoute (adminOnly) | Admin dashboard |
| `/` | SmartRedirect | — | Auto-redirect |
| `*` | SmartRedirect | — | Catch-all redirect |

### AuthContext (State Management)
Uses `useReducer` for auth state management:
- **State**: `{ user, isAuthenticated, isLoading, error }`
- **Actions**: `AUTH_START`, `AUTH_SUCCESS`, `AUTH_ERROR`, `AUTH_LOGOUT`, `SET_LOADING`, `CLEAR_ERROR`
- **On mount**: Checks localStorage for access token → calls `GET /api/profile` to validate → sets user state.
- **Exposed methods**: `login()`, `register()`, `logout()`, `logoutAll()`, `clearError()`, `refreshProfile()`

### guardianApi.js (API Client)
A centralized Axios instance with:
- **Base URL**: `/api` (proxied to backend)
- **Request Interceptor**: Attaches `Bearer <token>` from `localStorage.getItem('campusx_access_token')`
- **Response Interceptor**: On 401 error:
  1. If not already refreshing, call `POST /api/auth/refresh-token`
  2. On success: store new token, replay failed request
  3. On failure: clear token, redirect to `/login`
  4. Queues concurrent failed requests and replays them all after refresh
- **~80 API methods** covering all 8 AI agents

### Onboarding Wizard Steps (8 steps)
1. **WelcomeStep** — Introduction screen
2. **CollegeStep** — Select college from 15 options
3. **BranchStep** — Select branch/department
4. **YearSemesterStep** — Select year and semester
5. **PersonalStep** — Username, bio, avatar
6. **InterestStep** — Select interests (AI-suggested)
7. **SkillStep** — Select skills (AI-suggested)
8. **CompletionStep** — Review and complete

### Components
| Component | Purpose |
|-----------|---------|
| **Navbar** | Top navigation bar with links to all dashboard sections, notifications, user menu |
| **PostCard** | Renders a single post with engagement buttons (like, comment, save, share) |
| **PostDetailModal** | Full post view with comments section |
| **CreatePostModal** | Form to create new posts (supports 9 post types with type-specific fields) |
| **RecommendationPanel** | Sidebar panel showing personalized recommendations |

---

## 18. Authentication Flow (End-to-End)

### Registration Flow
```
1. User fills register form (email, password, firstName, lastName, college, branch, semester)
2. POST /api/auth/register
   → authLimiter (5/15min)
   → registerValidation (express-validator)
   → authController.register()
     → authService.register()
       → Validate college against colleges.json
       → Check for duplicate email
       → validatePasswordStrength()
       → hashPassword() (bcrypt-12)
       → Create User document (status: 'pending')
       → Generate 6-digit OTP → store in Redis/cache (10min TTL)
       → Send OTP email via nodemailer
       → Log registration event in LoginLog
       → Run fraud detection (disposable email check, IP clustering)
       → Calculate initial trust score
   → Response: { success: true, message: "OTP sent to email" }
3. User enters OTP on /verify-otp page
4. POST /api/auth/verify-otp
   → Validate OTP against cached value
   → Set user status to 'active', emailVerified: true
   → Generate accessToken (15min) + refreshToken (7d)
   → Set refreshToken as httpOnly cookie
   → Response: { accessToken, user }
5. Client stores accessToken in localStorage
6. Redirected to /onboarding (8-step wizard)
7. After onboarding → redirected to /dashboard/feed
```

### Login Flow
```
1. POST /api/auth/login { email, password, rememberMe }
   → Check if account is locked (5 failed attempts → 15min lock)
   → Load user with passwordHash (select: '+passwordHash')
   → comparePassword(input, hash) via bcrypt
   → On failure: increment failedLoginAttempts, possibly lock account
   → On success: reset failedLoginAttempts, update lastLoginAt/lastLoginIp
   → Create Session document
   → Generate accessToken + refreshToken
   → Run fraud detection checks
   → Log login event
   → Set refresh token as httpOnly cookie
   → Response: { accessToken, user }
```

### Token Refresh Flow
```
1. Axios interceptor catches 401 response
2. POST /api/auth/refresh-token (uses httpOnly cookie)
   → Verify refresh token
   → Find matching session
   → Generate new accessToken
   → Rotate refresh token (optional)
   → Response: { accessToken }
3. Interceptor retries the original failed request with new token
4. Concurrent 401s are queued and replayed after refresh
```

---

## 19. Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/campusx

# Redis (optional — falls back to in-memory)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_REFRESH_EXPIRY_REMEMBER=30d

# CSRF
CSRF_SECRET=your-csrf-secret

# SMTP (Email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-pass
EMAIL_FROM=guardian@campusx.edu

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=15
MAX_SESSIONS_PER_USER=5

# Frontend
CLIENT_URL=http://localhost:5173

# Admin (auto-created on first startup)
ADMIN_EMAIL=admin@campusx.edu
ADMIN_PASSWORD=Admin@CampusX2026
```

---

## 20. Seed Data

| Script | Purpose |
|--------|---------|
| `seeds/seedColleges.js` | Seeds the colleges.json data into the database |
| `seeds/seedFeed.js` | Seeds sample posts for testing the feed |
| `seeds/seedGamification.js` | Seeds achievements, badges, rewards, and sample leaderboard data |

Run seeds: `npm run seed` (from server directory).

---

## 21. Tests

| Test File | Coverage |
|-----------|----------|
| `tests/runTests.js` | Test runner orchestrator |
| `tests/testPhase2.cjs` | Tests for ProfilePilot + FeedSense (onboarding, profile, feed, posts) |
| `tests/testPhase3Rewards.cjs` | Tests for RankForge rewards system |
| `tests/testSafeVoice.cjs` | Tests for SafeVoice anonymous posting |
| `tests/testCollaborationAndContent.cjs` | Tests for BranchConnect + CreatorBoost |
| `tests/testPulseNotify.cjs` | Tests for PulseNotify notifications |
| `tests/verifyPhase4.js` | End-to-end verification of all Phase 4 features |

---

## Quick Reference: How a Request Flows Through the System

**Example: User likes a post**

```
1. User clicks "Like" button on PostCard.jsx
2. PostCard calls guardianApi.toggleLike(postId)
3. Axios sends POST /api/feed/like { postId } with Bearer token
4. Vite proxy forwards to http://localhost:5000/api/feed/like

5. Express middleware pipeline:
   → helmet, cors, hpp, json parser, cookie parser
   → morgan logs the request
   → generalLimiter checks rate (100/15min)
   → inputSanitizer cleans the body
   → deviceTracker extracts IP/UA

6. feedRoutes.js matches POST /like:
   → authenticate → verifies JWT, loads user → req.user = { id, email, role }
   → engagementValidation → validates { postId } exists
   → antiCheatGuard('like') →
     a. Checks if user is liking own post → skip gamification
     b. Checks if same IP as post author → skip gamification
     c. Checks Redis velocity (10 likes/5min) → skip gamification if exceeded

7. feedController.toggleLike(req, res):
   → Calls feedService.toggleLike(userId, postId)
   → feedService:
     a. Check if Like document exists
     b. If exists: delete it (unlike), decrement post.likesCount
     c. If not: create Like, increment post.likesCount
     d. If !req.skipGamification → pointsService.awardPoints(userId, 'like', 2)
     e. Create notification for post author via socketService.createAndSendNotification()
     f. Broadcast updated counts via socketService.notifyEngagement(postId, { likesCount })

8. Response: { success: true, data: { liked: true, likesCount: 42 } }

9. Socket.IO broadcasts to all clients viewing that post:
   → 'engagement-update' { postId, likesCount: 42 }
   → PostCard components update their counter in real-time

10. Post author receives notification via Socket.IO:
    → 'notification' { type: 'like', title: '...', message: '...' }
```

---

**End of Documentation**

*This document was generated from the actual codebase on July 9, 2026. Total: 15 route files, 15 controllers, 57 services, 64 models, 18 repositories, 10 validators, 9 middleware, ~80 client API methods, 8 AI agent modules.*
