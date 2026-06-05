module.exports = {
  // User statuses
  USER_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    BLOCKED: 'blocked',
    DEACTIVATED: 'deactivated',
  },

  // User roles
  ROLES: {
    STUDENT: 'student',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // Risk levels
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  // Verification statuses
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    MANUAL_REVIEW: 'manual_review',
    PARTIAL: 'partial',
  },

  // Trust score weights
  TRUST_WEIGHTS: {
    EMAIL_VERIFIED: 25,
    ROLL_NUMBER_VALID: 20,
    BRANCH_MATCHED: 15,
    SEMESTER_VALID: 10,
    ACCOUNT_AGE: 10,
    CLEAN_RECORD: 10,
    DEVICE_TRUST: 10,
  },

  // Account age thresholds (days) for trust
  ACCOUNT_AGE_THRESHOLD: 30,

  // Security event types
  SECURITY_EVENTS: {
    SUSPICIOUS_REGISTRATION: 'suspicious_registration',
    DUPLICATE_ACCOUNT: 'duplicate_account',
    BRUTE_FORCE: 'brute_force_attempt',
    RATE_LIMIT: 'rate_limit_exceeded',
    INVALID_TOKEN: 'invalid_token',
    SESSION_HIJACK: 'session_hijack_attempt',
    IP_ANOMALY: 'ip_anomaly',
    DEVICE_ANOMALY: 'device_anomaly',
    FRAUD_DETECTED: 'fraud_detected',
    RISK_CHANGE: 'risk_level_change',
    ACCOUNT_BLOCKED: 'account_blocked',
    ACCOUNT_SUSPENDED: 'account_suspended',
    MANUAL_REVIEW: 'manual_review_required',
    VERIFICATION_FAILED: 'verification_failed',
    DISPOSABLE_EMAIL: 'disposable_email',
    CSRF_VIOLATION: 'csrf_violation',
    XSS_ATTEMPT: 'xss_attempt',
  },

  // Login log actions
  LOGIN_ACTIONS: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    LOGOUT_ALL: 'logout_all',
    REGISTER: 'register',
    TOKEN_REFRESH: 'token_refresh',
    PASSWORD_CHANGE: 'password_change',
    PASSWORD_RESET: 'password_reset',
    ACCOUNT_LOCKED: 'account_locked',
    ACCOUNT_UNLOCKED: 'account_unlocked',
  },

  // Severity levels
  SEVERITY: {
    INFO: 'info',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },

  // Cookie names
  COOKIES: {
    REFRESH_TOKEN: 'campusx_refresh_token',
    CSRF_TOKEN: 'campusx_csrf_token',
  },

  // Rate limit keys
  RATE_LIMIT_KEYS: {
    LOGIN: 'rl:login:',
    REGISTER: 'rl:register:',
    OTP: 'rl:otp:',
    PASSWORD_RESET: 'rl:password_reset:',
    GENERAL: 'rl:general:',
  },
};
