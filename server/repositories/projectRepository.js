const Project = require('../models/Project');
const ProjectTeam = require('../models/ProjectTeam');
const TeamMatch = require('../models/TeamMatch');

class ProjectRepository {
  // --- Projects ---
  static async createProject(data) {
    const project = new Project(data);
    await project.save();
    return project;
  }

  static async findById(id) {
    return await Project.findById(id).populate('userId', 'firstName lastName email branch semester').populate('teamId').lean();
  }

  static async listProjects(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.category) query.category = filters.category;
    if (filters.techStack) query.techStack = { $in: filters.techStack };
    if (filters.minQualityScore) query.qualityScore = { $gte: filters.minQualityScore };
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const docs = await Project.find(query)
      .sort({ qualityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName branch semester')
      .lean();

    const total = await Project.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async updateQuality(projectId, { qualityScore, completenessScore, readabilityScore }) {
    return await Project.findByIdAndUpdate(
      projectId,
      { $set: { qualityScore, completenessScore, readabilityScore } },
      { new: true }
    );
  }

  static async incrementLikes(projectId) {
    return await Project.findByIdAndUpdate(projectId, { $inc: { likesCount: 1 } }, { new: true });
  }

  static async incrementViews(projectId) {
    return await Project.findByIdAndUpdate(projectId, { $inc: { viewsCount: 1 } }, { new: true });
  }

  // --- Project Teams ---
  static async createTeam(data) {
    const team = new ProjectTeam(data);
    await team.save();
    return team;
  }

  static async findTeamById(teamId) {
    return await ProjectTeam.findById(teamId).populate('creatorId', 'firstName lastName').populate('members.userId', 'firstName lastName email').lean();
  }

  static async listTeams(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.skills) query.skillsRequired = { $in: filters.skills };
    if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;
    if (filters.creatorId) query.creatorId = filters.creatorId;

    const skip = (page - 1) * limit;
    const docs = await ProjectTeam.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'firstName lastName branch semester')
      .lean();

    const total = await ProjectTeam.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async inviteOrRequestMember(teamId, userId, role, status = 'pending') {
    const team = await ProjectTeam.findById(teamId);
    if (!team) throw new Error('Team not found');

    const memberIndex = team.members.findIndex(m => m.userId.toString() === userId.toString());
    if (memberIndex > -1) {
      // Update role and status if exists
      team.members[memberIndex].role = role;
      team.members[memberIndex].status = status;
    } else {
      team.members.push({ userId, role, status, joinedAt: new Date() });
    }

    await team.save();
    return team;
  }

  static async updateMemberStatus(teamId, userId, status) {
    return await ProjectTeam.findOneAndUpdate(
      { _id: teamId, 'members.userId': userId },
      { $set: { 'members.$.status': status } },
      { new: true }
    );
  }

  static async removeMember(teamId, userId) {
    return await ProjectTeam.findByIdAndUpdate(
      teamId,
      { $pull: { members: { userId } } },
      { new: true }
    );
  }

  // --- Teammate Matching Engine ---
  static async saveTeamMatches(userId, matches) {
    await TeamMatch.deleteMany({ userId });
    if (matches.length === 0) return [];
    return await TeamMatch.insertMany(matches);
  }

  static async getTeamMatches(userId, limit = 10) {
    return await TeamMatch.find({ userId, status: 'active' })
      .populate('targetUserId', 'firstName lastName email branch semester')
      .populate('targetTeamId')
      .sort({ compatibilityScore: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = ProjectRepository;
