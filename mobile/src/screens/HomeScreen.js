import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useFeedStore } from '../store/feedStore';
import { connectSocket, getSocket } from '../api/socketClient';
import { useUserStore } from '../store/userStore';
import FeedCard from '../components/FeedCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { EmptyState } from '../components/StateViews';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { accessToken } = useUserStore();
  const {
    feeds,
    activeTab,
    loading,
    refreshing,
    hasMore,
    setActiveTab,
    fetchFeed,
    prependPostToFeed,
    updatePostMetricsInFeeds,
  } = useFeedStore();

  // 1. Initial Load of Feed
  useEffect(() => {
    fetchFeed(activeTab, true);
  }, [activeTab]);

  // 2. Setup Real-time Listeners
  useEffect(() => {
    if (!accessToken) return;

    // Connect to sockets and wire feed events
    const socket = connectSocket(accessToken, {
      'new-post': (post) => {
        prependPostToFeed(post);
      },
      'engagement-update': (data) => {
        updatePostMetricsInFeeds(data.postId, data);
      },
    });

    return () => {
      // Keep socket open but remove specific event listeners if components unmount
      if (socket) {
        socket.off('new-post');
        socket.off('engagement-update');
      }
    };
  }, [accessToken]);

  const handleRefresh = () => {
    fetchFeed(activeTab, true);
  };

  const handleLoadMore = () => {
    if (hasMore[activeTab] && !loading[activeTab]) {
      fetchFeed(activeTab, false);
    }
  };

  const renderTopTab = (tabId, label) => {
    const isActive = activeTab === tabId;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isActive ? { borderBottomColor: theme.primary } : { borderBottomColor: 'transparent' },
        ]}
        onPress={() => setActiveTab(tabId)}
      >
        <Text style={[styles.tabLabel, { color: isActive ? theme.primary : theme.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const feedList = feeds[activeTab] || [];
  const showSkeleton = loading[activeTab] && feedList.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Dynamic Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.tabBar }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>CampusX Feed</Text>
      </View>

      {/* Top Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderBottomColor: theme.border }]}>
        {renderTopTab('for-you', 'For You')}
        {renderTopTab('following', 'Following')}
        {renderTopTab('branch', 'My Branch')}
      </View>

      {/* Feed Viewport */}
      {showSkeleton ? (
        <SkeletonLoader />
      ) : (
        <FlatList
          data={feedList}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FeedCard post={item} navigation={navigation} />}
          onRefresh={handleRefresh}
          refreshing={!!refreshing[activeTab]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.listContent}
          
          // Performance Optimizations for 60 FPS FlatList
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 6,
  },
});
