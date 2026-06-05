const mongoose = require('mongoose');

const trendingDataSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    trendingScore: {
      type: Number,
      required: true,
      default: 0,
    },
    scope: {
      type: String,
      required: true,
      enum: ['global', 'college', 'branch'],
      default: 'global',
    },
    scopeValue: {
      type: String,
      default: 'global', // e.g. college name like 'CampusX HQ' or branch like 'Computer Science'
    },
  },
  {
    timestamps: true,
  }
);

trendingDataSchema.index({ scope: 1, scopeValue: 1, trendingScore: -1 });
trendingDataSchema.index({ postId: 1 });
// TTL index: trending calculations expire after 24 hours (86,400 seconds)
trendingDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('TrendingData', trendingDataSchema);
