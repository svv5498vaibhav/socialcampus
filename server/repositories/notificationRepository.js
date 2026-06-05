const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

class NotificationRepository {
  static async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  }

  static async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { $set: { isRead: true } },
      { new: true }
    );
  }

  static async markAllAsRead(userId) {
    return await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  static async getUserNotifications(userId, filters = {}, page = 1, limit = 20) {
    const query = { recipientId: userId };
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;

    const skip = (page - 1) * limit;
    const docs = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'firstName lastName')
      .lean();

    const total = await Notification.countDocuments(query);
    return { docs, total, page, limit };
  }

  // --- Preferences ---
  static async getPreferences(userId) {
    let pref = await NotificationPreference.findOne({ userId }).lean();
    if (!pref) {
      // Create default preference
      pref = new NotificationPreference({ userId });
      await pref.save();
      pref = pref.toObject();
    }
    return pref;
  }

  static async updatePreferences(userId, updateData) {
    return await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: { preferences: updateData } },
      { new: true, upsert: true }
    );
  }
}

module.exports = NotificationRepository;
