class NotificationPrioritizer {
  /**
   * Assesses the priority of an incoming notification based on type, context, and message content.
   */
  static assessPriority(type, title = '', message = '') {
    const combinedText = `${title} ${message}`.toLowerCase();

    // 1. Critical priority (Security threats, account compromise, urgent mental safety indicators)
    if (
      combinedText.includes('compromised') ||
      combinedText.includes('unauthorized login') ||
      combinedText.includes('suicide') ||
      combinedText.includes('self-harm') ||
      combinedText.includes('threat')
    ) {
      return 'critical';
    }

    // 2. High priority (Direct action items: invitations, mentions, grade/rank shifts, security alerts)
    if (
      type === 'team_invite' ||
      type === 'community_invite' ||
      type === 'event_invite' ||
      type === 'rank_change' ||
      type === 'mention'
    ) {
      return 'high';
    }

    // 3. Medium priority (Achievements, badge unlocks, trending alerts, internship matches)
    if (
      type === 'achievement' ||
      type === 'badge_unlock' ||
      type === 'internship_opp' ||
      type === 'trending'
    ) {
      return 'medium';
    }

    // 4. Low priority (Ambient updates: follows, likes, basic comments)
    return 'low';
  }
}

module.exports = NotificationPrioritizer;
