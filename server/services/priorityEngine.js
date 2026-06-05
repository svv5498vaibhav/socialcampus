/**
 * Priority & Escalation Engine - Assesses risk severity and routes alerts
 */

const SAFETY_TRIGGERS = [
  /suicide/i, /kill myself/i, /end my life/i, /self harm/i, /depression/i, /want to die/i,
  /bomb/i, /shoot/i, /weapon/i, /stab/i, /attack/i, /violence/i, /murder/i, /assault/i,
  /sexual harassment/i, /harassment/i, /bullying/i, /doxx/i, /leak my address/i, /leak my number/i
];

const HIGH_TRIGGERS = [
  /leak/i, /flood/i, /short circuit/i, /broken window/i, /theft/i, /stolen/i, /cheated/i,
  /blackmail/i, /corrupt/i, /bribe/i, /fire/i
];

class PriorityEngine {
  /**
   * Assess priority and escalation routing
   * @param {string} text 
   * @param {string} type - e.g., 'complaint', 'issue'
   * @returns {object} { priority: 'low'|'medium'|'high'|'critical', escalation: { escalateTo: string, reason: string } | null }
   */
  static assess(text, type) {
    if (!text || typeof text !== 'string') {
      return { priority: 'low', escalation: null };
    }

    const cleanText = text.trim();

    // 1. Critical safety trigger scan (Mental health, physical threats, harassment)
    for (const pattern of SAFETY_TRIGGERS) {
      if (pattern.test(cleanText)) {
        let escalateTo = 'dean';
        let reason = `Triggered critical safety pattern match: ${pattern.toString()}`;

        if (/suicide|self harm|depression|want to die/i.test(cleanText)) {
          escalateTo = 'director'; // Direct routing to senior administration/counselor
          reason = 'Mental Health / Self-harm threat warning detected';
        } else if (/warden/i.test(cleanText) || /hostel/i.test(cleanText)) {
          escalateTo = 'warden';
        }

        return {
          priority: 'critical',
          escalation: {
            escalateTo,
            reason,
          },
        };
      }
    }

    // 2. High severity scan (Corruption, theft, leaks, water/fire hazards)
    for (const pattern of HIGH_TRIGGERS) {
      if (pattern.test(cleanText)) {
        return {
          priority: 'high',
          escalation: {
            escalateTo: 'dean',
            reason: `High risk hazard warning: ${pattern.toString()}`,
          },
        };
      }
    }

    // 3. Medium or Low routing based on type
    if (type === 'complaint' || type === 'issue' || type === 'academic_concern') {
      return { priority: 'medium', escalation: null };
    }

    return { priority: 'low', escalation: null };
  }
}

module.exports = PriorityEngine;
