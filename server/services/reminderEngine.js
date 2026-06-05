const Event = require('../models/Event');
const InternshipRecommendation = require('../models/InternshipRecommendation');

class ReminderEngine {
  /**
   * Generates dynamic reminder schedules for a student.
   */
  static async evaluateReminders(userId, userProfile) {
    const reminders = [];
    const now = new Date();

    // 1. Incomplete Profile check
    const completeness = userProfile.profileCompletionScore || 0;
    if (completeness < 80) {
      reminders.push({
        userId,
        title: 'Complete your profile details to increase visibility',
        type: 'profile_completeness',
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        triggerDetails: { completeness },
      });
    }

    // 2. Pending Projects check
    const projectsCount = (userProfile.projects || []).length;
    if (projectsCount === 0 && (userProfile.skills || []).length >= 3) {
      reminders.push({
        userId,
        title: 'Link a project repository to showcase your skills',
        type: 'project_pending',
        scheduledAt: new Date(Date.now() + 7200000), // 2 hours from now
        triggerDetails: { skillsCount: userProfile.skills.length },
      });
    }

    // 3. Upcoming Event deadlines
    // Find events where user is registered and event starts within 24h
    const registeredEvents = await Event.find({
      'registeredMembers.userId': userId,
      startTime: { $gt: now, $lte: new Date(Date.now() + 86400000) },
      status: 'upcoming',
    }).lean();

    for (const event of registeredEvents) {
      reminders.push({
        userId,
        title: `Reminder: Upcoming event "${event.title}" starts soon`,
        type: 'event_deadline',
        scheduledAt: new Date(event.startTime.getTime() - 3600000), // 1 hour before start
        triggerDetails: { eventId: event._id, startTime: event.startTime },
      });
    }

    // 4. Internship Deadline approaching (matching opportunities expiring in 3 days)
    const matchingExpiringOpps = await InternshipRecommendation.find({
      userId,
      deadline: { $gt: now, $lte: new Date(Date.now() + 3 * 86400000) },
      status: 'active',
    }).lean();

    for (const opp of matchingExpiringOpps) {
      reminders.push({
        userId,
        title: `Deadline warning: Apply for "${opp.title}" at ${opp.company}`,
        type: 'internship_deadline',
        scheduledAt: new Date(Date.now() + 1800000), // 30 mins from now
        triggerDetails: { oppId: opp._id, company: opp.company, deadline: opp.deadline },
      });
    }

    return reminders;
  }
}

module.exports = ReminderEngine;
