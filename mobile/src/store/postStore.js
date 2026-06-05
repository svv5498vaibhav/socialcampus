import { create } from 'zustand';
import apiClient from '../api/apiClient.js';
import { useFeedStore } from './feedStore.js';

export const usePostStore = create((set, get) => ({
  comments: {}, // postId -> list of comments
  commentsLoading: {},
  likedPosts: new Set(), // Set of postId strings liked by user
  savedPosts: new Set(), // Set of postId strings bookmarked by user

  toggleLike: async (postId) => {
    const isCurrentlyLiked = get().likedPosts.has(postId);
    const feedStore = useFeedStore.getState();

    // 1. Find the post to compute optimistic counts
    let originalLikesCount = 0;
    // Look up in any tab
    const activeTab = feedStore.activeTab;
    const post = feedStore.feeds[activeTab]?.find((p) => p._id === postId);
    if (post) {
      originalLikesCount = post.likesCount;
    }

    // 2. Perform Optimistic Update
    set((state) => {
      const nextLiked = new Set(state.likedPosts);
      if (isCurrentlyLiked) {
        nextLiked.delete(postId);
      } else {
        nextLiked.add(postId);
      }
      return { likedPosts: nextLiked };
    });

    const nextLikesCount = isCurrentlyLiked
      ? Math.max(originalLikesCount - 1, 0)
      : originalLikesCount + 1;

    feedStore.updatePostMetricsInFeeds(postId, { likesCount: nextLikesCount });

    // 3. Trigger API Call
    try {
      const response = await apiClient.post('/feed/like', { postId });
      const { isLiked: serverLiked, metrics } = response.data.data;

      // Sync with final server state
      set((state) => {
        const nextLiked = new Set(state.likedPosts);
        if (serverLiked) {
          nextLiked.add(postId);
        } else {
          nextLiked.delete(postId);
        }
        return { likedPosts: nextLiked };
      });
      feedStore.updatePostMetricsInFeeds(postId, metrics);
    } catch (err) {
      console.error('Like toggle failed, rolling back:', err.message);
      // Rollback
      set((state) => {
        const nextLiked = new Set(state.likedPosts);
        if (isCurrentlyLiked) {
          nextLiked.add(postId);
        } else {
          nextLiked.delete(postId);
        }
        return { likedPosts: nextLiked };
      });
      feedStore.updatePostMetricsInFeeds(postId, { likesCount: originalLikesCount });
    }
  },

  toggleSave: async (postId) => {
    const isCurrentlySaved = get().savedPosts.has(postId);
    const feedStore = useFeedStore.getState();

    let originalSavesCount = 0;
    const activeTab = feedStore.activeTab;
    const post = feedStore.feeds[activeTab]?.find((p) => p._id === postId);
    if (post) {
      originalSavesCount = post.savesCount;
    }

    // 1. Optimistic Update
    set((state) => {
      const nextSaved = new Set(state.savedPosts);
      if (isCurrentlySaved) {
        nextSaved.delete(postId);
      } else {
        nextSaved.add(postId);
      }
      return { savedPosts: nextSaved };
    });

    const nextSavesCount = isCurrentlySaved
      ? Math.max(originalSavesCount - 1, 0)
      : originalSavesCount + 1;

    feedStore.updatePostMetricsInFeeds(postId, { savesCount: nextSavesCount });

    // 2. Trigger API Call
    try {
      const response = await apiClient.post('/feed/save', { postId });
      const { isSaved: serverSaved, metrics } = response.data.data;

      set((state) => {
        const nextSaved = new Set(state.savedPosts);
        if (serverSaved) {
          nextSaved.add(postId);
        } else {
          nextSaved.delete(postId);
        }
        return { savedPosts: nextSaved };
      });
      feedStore.updatePostMetricsInFeeds(postId, metrics);
    } catch (err) {
      console.error('Save toggle failed, rolling back:', err.message);
      set((state) => {
        const nextSaved = new Set(state.savedPosts);
        if (isCurrentlySaved) {
          nextSaved.add(postId);
        } else {
          nextSaved.delete(postId);
        }
        return { savedPosts: nextSaved };
      });
      feedStore.updatePostMetricsInFeeds(postId, { savesCount: originalSavesCount });
    }
  },

  fetchComments: async (postId) => {
    set((state) => ({
      commentsLoading: { ...state.commentsLoading, [postId]: true },
    }));

    try {
      const response = await apiClient.get(`/feed/posts/${postId}/comments`);
      set((state) => ({
        comments: { ...state.comments, [postId]: response.data.data },
        commentsLoading: { ...state.commentsLoading, [postId]: false },
      }));
    } catch (err) {
      console.error('Failed to load comments:', err.message);
      set((state) => ({
        commentsLoading: { ...state.commentsLoading, [postId]: false },
      }));
    }
  },

  addComment: async (postId, content) => {
    try {
      const response = await apiClient.post('/feed/comment', { postId, content });
      const { comment, metrics } = response.data.data;

      // Add to local comments array
      set((state) => {
        const postComments = state.comments[postId] || [];
        return {
          comments: {
            ...state.comments,
            [postId]: [...postComments, comment],
          },
        };
      });

      // Update parent post metrics count
      useFeedStore.getState().updatePostMetricsInFeeds(postId, metrics);
    } catch (err) {
      console.error('Failed to add comment:', err.message);
      throw err;
    }
  },

  votePoll: async (postId, optionIndex) => {
    const feedStore = useFeedStore.getState();
    const activeTab = feedStore.activeTab;
    const post = feedStore.feeds[activeTab]?.find((p) => p._id === postId);
    if (!post) return;

    // Cache original metadata for rollbacks
    const originalMetadata = JSON.parse(JSON.stringify(post.metadata));

    // Perform optimistic vote update locally
    const options = post.metadata.pollOptions || post.metadata.options || [];
    // Remove user vote from any previous options
    // (mocking user ID locally or since we don't have user ID in store, just simulate)
    // We increment votes on the chosen index
    const nextMetadata = JSON.parse(JSON.stringify(post.metadata));
    const nextOptions = nextMetadata.pollOptions || nextMetadata.options || [];
    if (nextOptions[optionIndex]) {
      nextOptions[optionIndex].votesCount = (nextOptions[optionIndex].votesCount || 0) + 1;
    }
    
    feedStore.updatePostMetricsInFeeds(postId, { metadata: nextMetadata });

    try {
      const response = await apiClient.post('/feed/poll/vote', { postId, optionIndex });
      const serverPost = response.data.data;

      feedStore.updatePostMetricsInFeeds(postId, {
        likesCount: serverPost.likesCount,
        commentsCount: serverPost.commentsCount,
        sharesCount: serverPost.sharesCount,
        savesCount: serverPost.savesCount,
        metadata: serverPost.metadata,
      });
    } catch (err) {
      console.error('Vote submission failed, rolling back:', err.message);
      feedStore.updatePostMetricsInFeeds(postId, { metadata: originalMetadata });
    }
  },
}));
