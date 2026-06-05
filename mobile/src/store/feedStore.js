import { create } from 'zustand';
import apiClient from '../api/apiClient.js';

export const useFeedStore = create((set, get) => ({
  feeds: {
    'for-you': [],
    'following': [],
    'branch': [],
    'trending': [],
    'projects': [],
    'internships': [],
    'events': [],
  },
  pages: {
    'for-you': 1,
    'following': 1,
    'branch': 1,
    'trending': 1,
    'projects': 1,
    'internships': 1,
    'events': 1,
  },
  loading: {},
  refreshing: {},
  hasMore: {},
  activeTab: 'for-you',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchFeed: async (tab, isRefresh = false) => {
    const currentPage = isRefresh ? 1 : (get().pages[tab] || 1);
    
    // Set loading indicator
    set((state) => ({
      loading: { ...state.loading, [tab]: !isRefresh },
      refreshing: { ...state.refreshing, [tab]: isRefresh },
    }));

    try {
      const response = await apiClient.get(`/feed/${tab}`, {
        params: {
          page: currentPage,
          limit: 10,
        },
      });

      const { posts, hasMore: serverHasMore } = response.data.data;

      set((state) => {
        const existingPosts = state.feeds[tab] || [];
        const nextPosts = isRefresh ? posts : [...existingPosts, ...posts];

        return {
          feeds: {
            ...state.feeds,
            [tab]: nextPosts,
          },
          pages: {
            ...state.pages,
            [tab]: currentPage + 1,
          },
          hasMore: {
            ...state.hasMore,
            [tab]: serverHasMore,
          },
          loading: { ...state.loading, [tab]: false },
          refreshing: { ...state.refreshing, [tab]: false },
        };
      });
    } catch (err) {
      console.error(`Failed to fetch feed ${tab}:`, err.message);
      set((state) => ({
        loading: { ...state.loading, [tab]: false },
        refreshing: { ...state.refreshing, [tab]: false },
      }));
    }
  },

  prependPostToFeed: (post) => {
    if (!post) return;
    set((state) => {
      const updatedFeeds = { ...state.feeds };

      // Prepend to For You
      updatedFeeds['for-you'] = [post, ...(updatedFeeds['for-you'] || [])];

      // Prepend to branch if author branch matches user's branch
      // (User context can be checked on client, but we will prepend to current branch feed if user belongs to same branch)
      updatedFeeds['branch'] = [post, ...(updatedFeeds['branch'] || [])];

      // Prepend to type-specific feeds
      if (post.type && updatedFeeds[post.type + 's']) {
        const typeTab = post.type + 's'; // e.g. project -> projects, event -> events
        updatedFeeds[typeTab] = [post, ...(updatedFeeds[typeTab] || [])];
      }

      return { feeds: updatedFeeds };
    });
  },

  updatePostMetricsInFeeds: (postId, metrics) => {
    set((state) => {
      const updatedFeeds = { ...state.feeds };
      
      Object.keys(updatedFeeds).forEach((tab) => {
        updatedFeeds[tab] = updatedFeeds[tab].map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              likesCount: metrics.likesCount ?? post.likesCount,
              commentsCount: metrics.commentsCount ?? post.commentsCount,
              sharesCount: metrics.sharesCount ?? post.sharesCount,
              savesCount: metrics.savesCount ?? post.savesCount,
              metadata: metrics.metadata ?? post.metadata,
            };
          }
          return post;
        });
      });

      return { feeds: updatedFeeds };
    });
  },
}));
