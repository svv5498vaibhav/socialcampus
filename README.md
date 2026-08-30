# 🛡️ CampusX — Guardian AI Module

> Enterprise-grade Authentication, Verification, Fraud Detection & Trust Management System

## Architecture Overview

Guardian AI is the security backbone of CampusX, responsible for ensuring only genuine college students access the platform.

### Core Capabilities

| Module | Description |
|--------|-------------|
| **Auth Engine** | JWT-based registration, login, token refresh with httpOnly cookies |
| **Verification Engine** | Auto-verifies college email domain, roll number format, branch, semester |
| **Fraud Detection Engine** | Detects disposable emails, IP clustering, brute force, suspicious patterns |
| **Trust Score Engine** | 0–100 score across 7 factors with automatic risk classification |
| **Risk Analysis Engine** | Low/Medium/High risk tiers with access-level restrictions |
| **Session Manager** | Multi-device sessions, device fingerprinting, bulk logout |
| **Audit System** | Complete login & security event logging with 90/180-day TTL |

### Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Redis (optional)
- **Frontend**: React.js (Vite), React Router, Axios
- **Security**: JWT, bcrypt-12, rate limiting, CSRF, XSS prevention, input sanitization

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017
- Redis (optional — falls back to in-memory store)

### Backend Setup

```bash
cd server
npm install
npm run dev
```

The server starts on `http://localhost:5000` and auto-creates an admin account:
- Email: `admin@campusx.edu`
- Password: `Admin@CampusX2026`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The client starts on `http://localhost:5173` with API proxy to backend.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Student registration |
| POST | `/api/auth/login` | ❌ | Student login |
| POST | `/api/auth/verify-otp` | ❌ | Verify email OTP |
| POST | `/api/auth/resend-otp` | ❌ | Resend OTP |
| POST | `/api/auth/refresh-token` | ❌ | Refresh access token |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |
| POST | `/api/auth/reset-password` | ❌ | Reset with OTP |
| POST | `/api/auth/logout` | ✅ | Logout current session |
| POST | `/api/auth/logout-all` | ✅ | Logout all devices |
| GET | `/api/profile` | ✅ | Get user profile |
| GET | `/api/security/status` | ✅ | Security & risk overview |
| GET | `/api/security/sessions` | ✅ | Active sessions |
| GET | `/api/security/login-history` | ✅ | Login audit trail |
| GET | `/api/security/trust-score` | ✅ | Trust score details |
| DELETE | `/api/security/sessions/:id` | ✅ | Revoke session |
| GET | `/api/admin/users` | 🔒 | List users (admin) |
| GET | `/api/admin/stats` | 🔒 | Dashboard stats (admin) |
| GET | `/api/admin/fraud-alerts` | 🔒 | Security alerts (admin) |
| PATCH | `/api/admin/users/:id/block` | 🔒 | Block/unblock user |
| PATCH | `/api/admin/users/:id/suspend` | 🔒 | Suspend/unsuspend user |

## Supported Colleges

15 pre-configured colleges. Admins can extend via `server/config/colleges.json`.

## Security Layers

1. **Rate Limiting** — 100 req/15min general, 5 req/15min auth endpoints
2. **Input Sanitization** — NoSQL injection, XSS, prototype pollution prevention
3. **Password Security** — bcrypt-12 hashing, strength validation
4. **JWT Tokens** — 15min access, 7d refresh (30d with remember me), rotation on refresh
5. **Account Lockout** — 5 failed attempts → 15min lock
6. **Device Tracking** — Fingerprint + IP per session
7. **Audit Trail** — Every auth event logged with IP, device, timestamp

## Agent Status

✅ **Agent 1: Guardian AI — Completed**
✅ **Agent 2: ProfilePilot AI — Completed**
✅ **Agent 3: FeedSense AI — Completed**
✅ **Agent 4: RankForge AI — Completed**
✅ **Agent 5: SafeVoice AI — Completed**
✅ **Agent 6: BranchConnect AI — Completed**
✅ **Agent 7: CreatorBoost AI — Completed**
✅ **Agent 8: PulseNotify AI — Completed**
