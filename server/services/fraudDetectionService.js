const { cache } = require('../config/redis');
const collegeService = require('./collegeService');
const auditService = require('./auditService');
const { SECURITY_EVENTS, SEVERITY } = require('../utils/constants');

const IP_REG_PREFIX = 'fraud:ip_reg:';
const IP_REG_WINDOW = 24 * 60 * 60; // 24 hours

/**
 * Fraud Detection Engine
 *
 * Analyzes registration and login events for anomalies.
 * Returns a fraud assessment with signals and recommended action.
 */
class FraudDetectionEngine {
  /**
   * Analyze a registration for fraud signals
   */
  static async analyzeRegistration({ email, rollNumber, ipAddress, college }) {
    const signals = [];
    let riskScore = 0;

    // Signal 1: Disposable email domain
    if (collegeService.isDisposableEmail(email)) {
      signals.push({
        type: 'disposable_email',
        severity: 'critical',
        weight: 40,
        message: 'Email domain is from a known disposable email provider',
      });
      riskScore += 40;

      await auditService.logSecurityEvent({
        eventType: SECURITY_EVENTS.DISPOSABLE_EMAIL,
        severity: SEVERITY.HIGH,
        description: `Disposable email detected: ${email}`,
        metadata: { email, domain: email.split('@')[1] },
        ipAddress,
      });
    }

    // Signal 2: Invalid college email domain
    if (!collegeService.isValidCollegeEmail(email)) {
      signals.push({
        type: 'invalid_college_email',
        severity: 'high',
        weight: 30,
        message: 'Email domain does not belong to any recognized college',
      });
      riskScore += 30;
    }

    // Signal 3: Email-college mismatch
    const consistency = collegeService.isEmailCollegeConsistent(email, college);
    if (!consistency.consistent && collegeService.isValidCollegeEmail(email)) {
      signals.push({
        type: 'email_college_mismatch',
        severity: 'high',
        weight: 25,
        message: `Email domain belongs to ${consistency.detectedCollege}, not ${college}`,
      });
      riskScore += 25;
    }

    // Signal 4: Multiple registrations from same IP (24h window)
    const ipRegCount = await this._getIPRegistrationCount(ipAddress);
    if (ipRegCount >= 3) {
      signals.push({
        type: 'multiple_registrations_same_ip',
        severity: 'high',
        weight: 30,
        message: `${ipRegCount} registrations from this IP in the last 24 hours`,
      });
      riskScore += 30;

      await auditService.logSecurityEvent({
        eventType: SECURITY_EVENTS.SUSPICIOUS_REGISTRATION,
        severity: SEVERITY.HIGH,
        description: `Multiple registrations from IP: ${ipAddress} (count: ${ipRegCount})`,
        metadata: { ipAddress, count: ipRegCount },
        ipAddress,
      });
    } else if (ipRegCount >= 2) {
      signals.push({
        type: 'multiple_registrations_same_ip',
        severity: 'medium',
        weight: 15,
        message: `${ipRegCount} registrations from this IP in the last 24 hours`,
      });
      riskScore += 15;
    }

    // Signal 5: Roll number format invalid
    if (rollNumber && college) {
      const rollCheck = collegeService.isValidRollNumber(rollNumber, college);
      if (!rollCheck.valid) {
        signals.push({
          type: 'invalid_roll_number_format',
          severity: 'medium',
          weight: 20,
          message: rollCheck.error,
        });
        riskScore += 20;
      }
    }

    // Increment IP registration counter
    await this._incrementIPRegistration(ipAddress);

    // Determine action
    const action = this._determineAction(riskScore);

    if (riskScore >= 50) {
      await auditService.logSecurityEvent({
        eventType: SECURITY_EVENTS.FRAUD_DETECTED,
        severity: riskScore >= 70 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        description: `Fraud score ${riskScore}/100 for registration: ${email}`,
        metadata: { email, signals, riskScore },
        ipAddress,
      });
    }

    return {
      riskScore: Math.min(riskScore, 100),
      signals,
      action,
      isSuspicious: riskScore >= 30,
      shouldBlock: riskScore >= 70,
    };
  }

  /**
   * Analyze a login attempt for anomalies
   */
  static async analyzeLogin({ userId, ipAddress, userAgent, previousIps = [] }) {
    const signals = [];
    let riskScore = 0;

    // Signal: Login from new IP not seen before
    if (previousIps.length > 0 && !previousIps.includes(ipAddress)) {
      signals.push({
        type: 'new_ip_address',
        severity: 'info',
        weight: 10,
        message: 'Login from a new IP address',
      });
      riskScore += 10;
    }

    // Signal: Check for rapid login attempts from this IP
    const loginAttemptsKey = `fraud:login_attempts:${ipAddress}`;
    const attempts = parseInt((await cache.get(loginAttemptsKey)) || '0', 10);

    if (attempts >= 10) {
      signals.push({
        type: 'brute_force_suspect',
        severity: 'critical',
        weight: 40,
        message: `${attempts} login attempts from this IP in the window`,
      });
      riskScore += 40;

      await auditService.logSecurityEvent({
        userId,
        eventType: SECURITY_EVENTS.BRUTE_FORCE,
        severity: SEVERITY.CRITICAL,
        description: `Potential brute force: ${attempts} attempts from ${ipAddress}`,
        metadata: { ipAddress, attempts },
        ipAddress,
      });
    } else if (attempts >= 5) {
      signals.push({
        type: 'elevated_login_attempts',
        severity: 'medium',
        weight: 15,
        message: `${attempts} login attempts from this IP`,
      });
      riskScore += 15;
    }

    // Track the attempt
    await cache.incr(loginAttemptsKey);
    await cache.expire(loginAttemptsKey, 900); // 15 min window

    return {
      riskScore: Math.min(riskScore, 100),
      signals,
      isSuspicious: riskScore >= 20,
    };
  }

  /**
   * Get IP registration count in 24h window
   */
  static async _getIPRegistrationCount(ipAddress) {
    const key = `${IP_REG_PREFIX}${ipAddress}`;
    const count = await cache.get(key);
    return parseInt(count || '0', 10);
  }

  /**
   * Increment IP registration counter
   */
  static async _incrementIPRegistration(ipAddress) {
    const key = `${IP_REG_PREFIX}${ipAddress}`;
    await cache.incr(key);
    await cache.expire(key, IP_REG_WINDOW);
  }

  /**
   * Determine recommended action based on risk score
   */
  static _determineAction(riskScore) {
    if (riskScore >= 70) return 'block';
    if (riskScore >= 40) return 'manual_review';
    if (riskScore >= 20) return 'flag';
    return 'allow';
  }
}

module.exports = FraudDetectionEngine;
