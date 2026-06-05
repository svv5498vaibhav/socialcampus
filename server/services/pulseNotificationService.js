const NotificationRepository = require('../repositories/notificationRepository');
const NotificationPrioritizer = require('./notificationPrioritizer');
const { getIO } = require('./socketService');

class PulseNotificationService {
  /**
   * Dispatches a notification after verifying user preferences and setting priorities.
   */
  static async sendNotification(recipientId, senderId, type, postId, title, message) {
    // 1. Evaluate Priority
    const priority = NotificationPrioritizer.assessPriority(type, title, message);

    // 2. Fetch User Channel Preferences
    const prefDoc = await NotificationRepository.getPreferences(recipientId);
    
    // Map notification types to preference categories
    const prefCategoryMap = {
      like: 'likes',
      comment: 'comments',
      mention: 'mentions',
      follow: 'follows',
      invite: 'invitations',
      team_invite: 'invitations',
      community_invite: 'invitations',
      event_invite: 'invitations',
      achievement: 'achievements',
      badge_unlock: 'achievements',
      trending: 'opportunities',
      internship_opp: 'opportunities',
    };

    const category = prefCategoryMap[type] || 'likes';
    const categoryPrefs = prefDoc.preferences[category] || { email: true, push: true, inApp: true };

    let savedNotification = null;

    // 3. Save and deliver in-app notification if allowed
    if (categoryPrefs.inApp) {
      savedNotification = await NotificationRepository.createNotification({
        recipientId,
        senderId,
        type,
        postId,
        title,
        message,
        priority,
      });

      // Deliver via Sockets
      try {
        const io = getIO();
        if (io) {
          io.to(`user:${recipientId}`).emit('notification', {
            id: savedNotification._id,
            senderId,
            type,
            postId,
            title,
            message,
            priority,
            isRead: false,
            createdAt: savedNotification.createdAt,
          });
        }
      } catch (wsErr) {
        console.warn('Socket delivery failed (user might be offline):', wsErr.message);
      }
    }

    // 4. Send email notifications (Stub/Logger implementation)
    if (categoryPrefs.email) {
      console.log(`✉️ [EMAIL SENT] to user ${recipientId}: "${title}" - ${message} [Priority: ${priority}]`);
    }

    // 5. Send push notifications via FCM (Stub/Logger implementation)
    if (categoryPrefs.push) {
      console.log(`📱 [PUSH SENT] to user ${recipientId}: "${title}" - ${message} [Priority: ${priority}]`);
    }

    return savedNotification;
  }

  static async getNotificationsForUser(userId, filters, page, limit) {
    return await NotificationRepository.getUserNotifications(userId, filters, page, limit);
  }

  static async markRead(userId, notificationId) {
    const doc = await NotificationRepository.markAsRead(notificationId);
    if (!doc || doc.recipientId.toString() !== userId.toString()) {
      throw new Error('Unauthorized or notification not found');
    }
    return doc;
  }

  static async markAllRead(userId) {
    return await NotificationRepository.markAllAsRead(userId);
  }

  static async getPreferences(userId) {
    return await NotificationRepository.getPreferences(userId);
  }

  static async updatePreferences(userId, updateData) {
    return await NotificationRepository.updatePreferences(userId, updateData);
  }
}

module.exports = PulseNotificationService;
