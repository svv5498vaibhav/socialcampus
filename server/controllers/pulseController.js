const { validationResult } = require('express-validator');
const PulseNotificationService = require('../services/pulseNotificationService');
const PulseAnalyticsService = require('../services/pulseAnalyticsService');
const CareerRepository = require('../repositories/careerRepository');
const AnalyticsRepository = require('../repositories/analyticsRepository');
const ActivityRepository = require('../repositories/activityRepository');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class PulseController {
  // Helper to emit socket events
  static emitRealtimeEvent(req, room, eventName, data) {
    const io = req.app.get('io');
    if (io) {
      io.to(room).emit(eventName, data);
    }
  }

  // --- Notifications ---
  static async getNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
        priority: req.query.priority,
        type: req.query.type,
      };

      const result = await PulseNotificationService.getNotificationsForUser(req.user.id, filters, page, limit);
      return sendSuccess(res, {
        message: 'User notifications retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await PulseNotificationService.markRead(req.user.id, notificationId);

      return sendSuccess(res, {
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async markAllNotificationsRead(req, res, next) {
    try {
      await PulseNotificationService.markAllRead(req.user.id);
      return sendSuccess(res, {
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req, res, next) {
    try {
      const preferences = await PulseNotificationService.getPreferences(req.user.id);
      return sendSuccess(res, {
        message: 'Notification delivery preferences retrieved',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const preferences = await PulseNotificationService.updatePreferences(req.user.id, req.body);
      return sendSuccess(res, {
        message: 'Notification preferences updated successfully',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Activity & Timeline ---
  static async trackActivity(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { action, details } = req.body;
      const log = await PulseAnalyticsService.trackActivity(req.user.id, action, details);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Activity tracked and growth score updated successfully',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const timeline = await ActivityRepository.getTimeline(req.user.id, startDate, endDate);

      return sendSuccess(res, {
        message: 'User activity timeline metrics retrieved',
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Career Insights & Internship Recommendations ---
  static async getCareerInsights(req, res, next) {
    try {
      const result = await PulseAnalyticsService.generateCareerPathInsights(req.user.id);
      return sendSuccess(res, {
        message: 'AI career insights and roadmap recommendations compiled',
        data: result,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getInternshipRecommendations(req, res, next) {
    try {
      const filters = {
        status: req.query.status || 'active',
        type: req.query.type,
      };
      const opportunities = await CareerRepository.getInternshipRecommendations(req.user.id, filters);

      return sendSuccess(res, {
        message: 'Matched career and internship opportunities retrieved',
        data: opportunities,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInternshipStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { recommendationId } = req.params;
      const { status } = req.body;

      const updated = await CareerRepository.updateInternshipStatus(recommendationId, status);
      return sendSuccess(res, {
        message: 'Opportunity status updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Reminders ---
  static async getReminders(req, res, next) {
    try {
      const reminders = await AnalyticsRepository.getReminderSchedules(req.user.id, 'pending');
      return sendSuccess(res, {
        message: 'Pending reminders schedules list retrieved',
        data: reminders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async triggerReminderEvaluation(req, res, next) {
    try {
      const reminders = await PulseAnalyticsService.scheduleReminders(req.user.id);
      return sendSuccess(res, {
        statusCode: 201,
        message: 'Reminders evaluated and generated successfully',
        data: reminders,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  // --- Session logs & Churn metrics ---
  static async logSession(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { durationMs } = req.body;
      const metric = await PulseAnalyticsService.logSession(req.user.id, durationMs);

      return sendSuccess(res, {
        message: 'User session logged and churn risk updated',
        data: metric,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Consolidated Analytics Dashboard ---
  static async getDashboard(req, res, next) {
    try {
      const dashboard = await PulseAnalyticsService.getConsolidatedDashboard(req.user.id);
      return sendSuccess(res, {
        message: 'Personalized student analytics dashboard retrieved successfully',
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PulseController;
