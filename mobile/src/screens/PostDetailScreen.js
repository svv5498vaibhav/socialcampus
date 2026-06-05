import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { usePostStore } from '../store/postStore';
import { useFeedStore } from '../store/feedStore';
import { connectSocket } from '../api/socketClient';
import UserAvatar from '../components/UserAvatar';
import BranchBadge from '../components/BranchBadge';
import { LoadingState } from '../components/StateViews';

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { theme } = useTheme();
  
  const { feeds, activeTab, updatePostMetricsInFeeds } = useFeedStore();
  const { comments, commentsLoading, fetchComments, addComment } = usePostStore();
  
  const [commentText, setCommentText] = useState('');

  // 1. Locate the post details in feed cache
  const post = feeds[activeTab]?.find((p) => p._id === postId);

  // 2. Fetch comments and configure websocket engagement listener
  useEffect(() => {
    fetchComments(postId);

    const socket = connectSocket(null, {
      'engagement-update': (data) => {
        if (data.postId === postId) {
          updatePostMetricsInFeeds(postId, data);
        }
      },
    });

    return () => {
      if (socket) {
        socket.off('engagement-update');
      }
    };
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment(postId, commentText);
      setCommentText('');
    } catch (err) {
      console.warn('Failed to add comment:', err.message);
    }
  };

  if (!post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Post not found.</Text>
      </View>
    );
  }

  const authorName = post.authorId
    ? `${post.authorId.firstName} ${post.authorId.lastName}`
    : 'CampusX User';

  const postComments = comments[postId] || [];
  const isLoading = commentsLoading[postId];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={postComments}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Creator Info */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('ProfilePreview', { userId: post.authorId?._id })}>
                  <UserAvatar
                    userId={post.authorId?._id || ''}
                    name={authorName}
                    avatarUrl={post.authorId?.avatarUrl}
                  />
                </TouchableOpacity>
                <View style={styles.headerText}>
                  <Text style={[styles.authorName, { color: theme.text }]}>{authorName}</Text>
                  <BranchBadge branch={post.authorId?.branch} />
                </View>
              </View>

              {/* Body */}
              <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
              <Text style={[styles.postContent, { color: theme.text }]}>{post.content}</Text>

              {post.aiSummary && (
                <View style={[styles.aiSummary, { backgroundColor: theme.background }]}>
                  <Text style={[styles.aiLabel, { color: theme.primary }]}>AI Summary</Text>
                  <Text style={[styles.aiText, { color: theme.textSecondary }]}>{post.aiSummary}</Text>
                </View>
              )}

              {/* Counters */}
              <Text style={[styles.counters, { color: theme.textSecondary }]}>
                {post.likesCount || 0} Likes  •  {post.commentsCount || 0} Comments  •  {post.viewsCount || 0} Views
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const commentUser = item.userId
              ? `${item.userId.firstName} ${item.userId.lastName}`
              : 'Student';
            return (
              <View style={[styles.commentCell, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
                <UserAvatar userId={item.userId?._id} name={commentUser} size={28} />
                <View style={styles.commentContent}>
                  <Text style={[styles.commentAuthor, { color: theme.text }]}>{commentUser}</Text>
                  <Text style={[styles.commentText, { color: theme.text }]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={isLoading ? <LoadingState /> : null}
        />

        {/* Comment Input Footer */}
        <View style={[styles.inputBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="Add to the discussion..."
            placeholderTextColor={theme.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmitComment}
          >
            <Text style={styles.sendText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 10,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  aiSummary: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  aiText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  counters: {
    fontSize: 12,
  },
  commentCell: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 12,
  },
  commentText: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
