const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const CommunityPost = require('../models/CommunityPost');
const Event = require('../models/Event');
const CommunityRecommendation = require('../models/CommunityRecommendation');

class CommunityRepository {
  static async createCommunity(data) {
    const community = new Community(data);
    await community.save();
    return community;
  }

  static async findById(id) {
    return await Community.findById(id).lean();
  }

  static async listCommunities(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.topic) query.topic = new RegExp(filters.topic, 'i');
    if (filters.search) {
      query.$or = [
        { name: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') }
      ];
    }
    
    const skip = (page - 1) * limit;
    const docs = await Community.find(query)
      .sort({ membersCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Community.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async addMember(communityId, userId, role = 'member') {
    const exists = await CommunityMember.findOne({ communityId, userId });
    if (exists) return { alreadyMember: true, record: exists };

    const record = new CommunityMember({ communityId, userId, role });
    await record.save();

    await Community.findByIdAndUpdate(communityId, { $inc: { membersCount: 1 } });
    return { alreadyMember: false, record };
  }

  static async removeMember(communityId, userId) {
    const deleted = await CommunityMember.findOneAndDelete({ communityId, userId });
    if (deleted) {
      await Community.findByIdAndUpdate(communityId, { $inc: { membersCount: -1 } });
      return true;
    }
    return false;
  }

  static async getRole(communityId, userId) {
    const member = await CommunityMember.findOne({ communityId, userId }).lean();
    return member ? member.role : null;
  }

  static async createPost(communityId, authorId, content, mediaUrls = []) {
    const post = new CommunityPost({ communityId, authorId, content, mediaUrls });
    await post.save();

    await Community.findByIdAndUpdate(communityId, { $inc: { postsCount: 1 } });
    return post;
  }

  static async listPosts(communityId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const docs = await CommunityPost.find({ communityId })
      .populate('authorId', 'firstName lastName email branch semester')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CommunityPost.countDocuments({ communityId });
    return { docs, total, page, limit };
  }

  // --- Events ---
  static async createEvent(data) {
    const event = new Event(data);
    await event.save();
    return event;
  }

  static async findEventById(eventId) {
    return await Event.findById(eventId).lean();
  }

  static async listEvents(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.communityId) query.communityId = filters.communityId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.organizerId) query.organizerId = filters.organizerId;

    const skip = (page - 1) * limit;
    const docs = await Event.find(query)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async registerForEvent(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    const alreadyRegistered = event.registeredMembers.some(m => m.userId.toString() === userId.toString());
    if (alreadyRegistered) return event;

    event.registeredMembers.push({ userId, registeredAt: new Date(), attended: false });
    await event.save();
    return event;
  }

  static async trackEventAttendance(eventId, userId, attended = true) {
    return await Event.findOneAndUpdate(
      { _id: eventId, 'registeredMembers.userId': userId },
      { $set: { 'registeredMembers.$.attended': attended } },
      { new: true }
    );
  }

  // --- Recommendations ---
  static async saveRecommendations(userId, recommendations) {
    // Overwrite existing recommendations for this user to keep it clean
    await CommunityRecommendation.deleteMany({ userId });
    if (recommendations.length === 0) return [];
    return await CommunityRecommendation.insertMany(recommendations);
  }

  static async getRecommendations(userId, limit = 5) {
    return await CommunityRecommendation.find({ userId, status: 'active' })
      .populate('communityId')
      .sort({ recommendationScore: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = CommunityRepository;
