const Report = require('../models/Report');

class ReportRepository {
  /**
   * Create a report
   */
  static async create(reportData) {
    return await Report.create(reportData);
  }

  /**
   * Check if a student has already reported a specific post
   */
  static async hasUserReported(postId, reporterHash) {
    const existing = await Report.findOne({ postId, reporterHash }).lean();
    return !!existing;
  }

  /**
   * Find paginated open reports
   */
  static async findOpenReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find({ status: 'open' })
        .populate('postId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments({ status: 'open' }),
    ]);

    return { reports, total, page, limit };
  }

  /**
   * Resolve/dismiss a report
   */
  static async resolveReport(reportId, adminId, status) {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Resolve all open reports for a specific postId (e.g. when post gets blocked)
   */
  static async resolveAllForPost(postId, adminId, status = 'resolved') {
    return await Report.updateMany(
      { postId, status: 'open' },
      {
        $set: {
          status,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      }
    );
  }
}

module.exports = ReportRepository;
