const LoginLog = require('../models/LoginLog');
const SecurityLog = require('../models/SecurityLog');

/**
 * Log a login event
 */
const logLoginEvent = async ({
  userId = null,
  email = null,
  action,
  ipAddress,
  userAgent = '',
  status,
  failureReason = null,
  deviceFingerprint = null,
}) => {
  try {
    await LoginLog.create({
      userId,
      email,
      action,
      ipAddress,
      userAgent,
      status,
      failureReason,
      deviceFingerprint,
    });
  } catch (error) {
    console.error('Audit: Failed to log login event:', error.message);
  }
};

/**
 * Log a security event
 */
const logSecurityEvent = async ({
  userId = null,
  eventType,
  severity,
  description,
  metadata = {},
  ipAddress = null,
}) => {
  try {
    await SecurityLog.create({
      userId,
      eventType,
      severity,
      description,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit: Failed to log security event:', error.message);
  }
};

/**
 * Get login history for a user
 */
const getLoginHistory = async (userId, limit = 20, page = 1) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    LoginLog.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginLog.countDocuments({ userId }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get security logs (admin)
 */
const getSecurityLogs = async ({ severity, eventType, resolved, limit = 50, page = 1 } = {}) => {
  const filter = {};
  if (severity) filter.severity = severity;
  if (eventType) filter.eventType = eventType;
  if (typeof resolved === 'boolean') filter.resolved = resolved;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    SecurityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email firstName lastName')
      .lean(),
    SecurityLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get unresolved high-severity alerts count
 */
const getAlertCount = async () => {
  return SecurityLog.countDocuments({
    resolved: false,
    severity: { $in: ['high', 'critical'] },
  });
};

module.exports = {
  logLoginEvent,
  logSecurityEvent,
  getLoginHistory,
  getSecurityLogs,
  getAlertCount,
};
