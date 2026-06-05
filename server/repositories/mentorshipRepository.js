const Mentorship = require('../models/Mentorship');

class MentorshipRepository {
  static async requestMentorship(data) {
    const mentorship = new Mentorship(data);
    await mentorship.save();
    return mentorship;
  }

  static async findById(id) {
    return await Mentorship.findById(id)
      .populate('mentorId', 'firstName lastName email branch semester')
      .populate('menteeId', 'firstName lastName email branch semester')
      .lean();
  }

  static async updateStatus(mentorshipId, status) {
    return await Mentorship.findByIdAndUpdate(mentorshipId, { $set: { status } }, { new: true });
  }

  static async addSession(mentorshipId, sessionData) {
    return await Mentorship.findByIdAndUpdate(
      mentorshipId,
      { $push: { sessions: sessionData } },
      { new: true }
    );
  }

  static async updateSessionCompletion(mentorshipId, sessionId, completed = true) {
    return await Mentorship.findOneAndUpdate(
      { _id: mentorshipId, 'sessions._id': sessionId },
      { $set: { 'sessions.$.completed': completed } },
      { new: true }
    );
  }

  static async submitFeedback(mentorshipId, rating, comment = '') {
    return await Mentorship.findByIdAndUpdate(
      mentorshipId,
      { $set: { feedback: { rating, comment } } },
      { new: true }
    );
  }

  static async listMentorships(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.mentorId) query.mentorId = filters.mentorId;
    if (filters.menteeId) query.menteeId = filters.menteeId;
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;
    const docs = await Mentorship.find(query)
      .sort({ createdAt: -1 })
      .populate('mentorId', 'firstName lastName email branch semester')
      .populate('menteeId', 'firstName lastName email branch semester')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Mentorship.countDocuments(query);
    return { docs, total, page, limit };
  }
}

module.exports = MentorshipRepository;
