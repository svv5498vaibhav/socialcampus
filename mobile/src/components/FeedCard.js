import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Share } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { usePostStore } from '../store/postStore';
import UserAvatar from './UserAvatar';
import BranchBadge from './BranchBadge';

export default React.memo(function FeedCard({ post, navigation }) {
  const { theme } = useTheme();
  const { likedPosts, savedPosts, toggleLike, toggleSave, votePoll } = usePostStore();

  const isLiked = likedPosts.has(post._id);
  const isSaved = savedPosts.has(post._id);

  const authorName = post.authorId
    ? `${post.authorId.firstName} ${post.authorId.lastName}`
    : 'CampusX User';

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on CampusX FeedSense AI: ${post.title}\n\n"${post.aiSummary || post.content.substring(0, 100)}..."`,
      });
      // Register share on server
      await apiClient.post('/feed/share', { postId: post._id, platform: 'native_share' }).catch(() => {});
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  // Render Poll Option Component
  const renderPoll = () => {
    const options = post.metadata?.pollOptions || post.metadata?.options || [];
    if (options.length === 0) return null;

    // Check if user has voted on any option in this poll
    let userVotedOptionIndex = -1;
    let totalVotes = 0;
    options.forEach((opt, idx) => {
      const votes = opt.votes || [];
      totalVotes += votes.length;
      // In a real environment, we'd check if activeUserId is in votes array.
      // For mock purposes, if votes are present, we can display percentages.
    });

    // Check if the current user has voted (mock checking if we have voted, or just show poll results if totalVotes > 0)
    const hasVoted = totalVotes > 0;

    return (
      <View style={styles.pollContainer}>
        {options.map((option, index) => {
          const votesCount = option.votes?.length || option.votesCount || 0;
          const pct = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.pollOptionButton, { borderColor: theme.border, backgroundColor: theme.primaryLight }]}
              onPress={() => votePoll(post._id, index)}
              disabled={hasVoted}
            >
              {hasVoted ? (
                <View style={styles.pollResultRow}>
                  <View style={[styles.pollPercentageBar, { width: `${pct}%`, backgroundColor: theme.primary }]} />
                  <Text style={[styles.pollOptionText, { color: theme.text, fontWeight: '600' }]}>{option.text}</Text>
                  <Text style={[styles.pollPercentText, { color: theme.textSecondary }]}>{pct}%</Text>
                </View>
              ) : (
                <Text style={[styles.pollOptionText, { color: theme.primary, textAlign: 'center' }]}>{option.text}</Text>
              )}
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.pollTotalVotes, { color: theme.textSecondary }]}>{totalVotes} votes</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
      activeOpacity={0.9}
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <UserAvatar
          userId={post.authorId?._id || ''}
          name={authorName}
          avatarUrl={post.authorId?.avatarUrl}
          size={38}
        />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: theme.text }]}>{authorName}</Text>
          <View style={styles.headerMetaRow}>
            <BranchBadge branch={post.authorId?.branch || 'CS'} />
            <Text style={[styles.metaDivider, { color: theme.textSecondary }]}>•</Text>
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {formatTimestamp(post.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.typeText, { color: theme.badgeText }]}>
            {(post.type || 'discussion').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* CONTENT BODY */}
      <View style={styles.contentBody}>
        {post.title ? (
          <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
        ) : null}
        
        <Text
          style={[styles.postContentText, { color: theme.text }]}
          numberOfLines={4}
          ellipsizeMode="tail"
        >
          {post.content}
        </Text>

        {/* Dynamic Project/Internship details */}
        {post.type === 'project' && post.metadata?.techStack ? (
          <View style={styles.metaTagsRow}>
            {post.metadata.techStack.slice(0, 3).map((tech, idx) => (
              <View key={idx} style={[styles.techTag, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.techTagText, { color: theme.primary }]}>{tech}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Poll Component */}
        {post.type === 'poll' && renderPoll()}

        {/* Render Media Preview */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <Image source={{ uri: post.mediaUrls[0] }} style={styles.mediaPreview} />
        ) : null}

        {/* AI Summary Highlight */}
        {post.aiSummary ? (
          <View style={[styles.aiSummaryContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.aiSummaryLabel, { color: theme.primary }]}>AI SUMMARY</Text>
            <Text style={[styles.aiSummaryText, { color: theme.textSecondary }]} numberOfLines={2}>
              {post.aiSummary}
            </Text>
          </View>
        ) : null}
      </View>

      {/* FOOTER COUNTERS & ACTIONS */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.countersRow}>
          <Text style={[styles.counterText, { color: theme.textSecondary }]}>
            {post.likesCount || 0} Likes  •  {post.commentsCount || 0} Comments  •  {post.viewsCount || 0} Views
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(post._id)}>
            <Text style={[styles.actionText, { color: isLiked ? theme.primary : theme.textSecondary }]}>
              {isLiked ? '❤️ Liked' : '🤍 Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
          >
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              💬 Comment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => toggleSave(post._id)}>
            <Text style={[styles.actionText, { color: isSaved ? theme.primary : theme.textSecondary }]}>
              {isSaved ? '🔖 Saved' : '📥 Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              📤 Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaDivider: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  metaText: {
    fontSize: 11,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  contentBody: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  postContentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaTagsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  techTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  techTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pollContainer: {
    marginVertical: 8,
  },
  pollOptionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  pollOptionText: {
    fontSize: 13,
  },
  pollResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  pollPercentageBar: {
    position: 'absolute',
    left: -12,
    top: -10,
    bottom: -10,
    opacity: 0.15,
  },
  pollPercentText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  pollTotalVotes: {
    fontSize: 11,
    marginTop: 2,
  },
  mediaPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
    marginVertical: 8,
  },
  aiSummaryContainer: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  aiSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  aiSummaryText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  countersRow: {
    marginBottom: 6,
  },
  counterText: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
