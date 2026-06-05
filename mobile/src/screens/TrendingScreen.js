import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { connectSocket } from '../api/socketClient';
import apiClient from '../api/apiClient';
import FeedCard from '../components/FeedCard';
import TrendingCard from '../components/TrendingCard';
import { LoadingState } from '../components/StateViews';

export default function TrendingScreen({ navigation }) {
  const { theme } = useTheme();
  
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Curated mock tags and communities matching CampusX seeds
  const trendingTags = [
    { rank: 1, title: 'Placement2026', subtitle: '43 posts today', type: 'tag' },
    { rank: 2, title: 'AI_Research', subtitle: '29 posts today', type: 'tag' },
    { rank: 3, title: 'WebDev', subtitle: '18 posts today', type: 'tag' },
    { rank: 4, title: 'BitsPilani', subtitle: '15 posts today', type: 'tag' }
  ];

  const trendingCommunities = [
    { rank: 1, title: 'AI/ML Research Lab', subtitle: '1,200 active members', type: 'community' },
    { rank: 2, title: 'DSA Placement Squad', subtitle: '980 active members', type: 'community' },
    { rank: 3, title: 'React Developers Guild', subtitle: '750 active members', type: 'community' }
  ];

  const fetchTrendingData = async () => {
    try {
      const response = await apiClient.get('/feed/trending', { params: { limit: 10 } });
      setTrendingPosts(response.data.data.posts || []);
    } catch (err) {
      console.warn('Failed to load trending posts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();

    // Setup real-time trending updates listener
    const socket = connectSocket(null, {
      'trending-update': (data) => {
        if (data.trendingPosts) {
          setTrendingPosts(data.trendingPosts);
        }
      },
    });

    return () => {
      if (socket) {
        socket.off('trending-update');
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.tabBar }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Trending Hub 🔥</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trending Tags Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Topics</Text>
        {trendingTags.map((tag) => (
          <TrendingCard
            key={tag.rank}
            rank={tag.rank}
            title={tag.title}
            subtitle={tag.subtitle}
            type="tag"
            onPress={() => navigation.navigate('Search')}
          />
        ))}

        {/* Trending Communities Section */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Trending Communities</Text>
        {trendingCommunities.map((c) => (
          <TrendingCard
            key={c.rank}
            rank={c.rank}
            title={c.title}
            subtitle={c.subtitle}
            type="group"
            onPress={() => {}}
          />
        ))}

        {/* Trending Posts FlatList (embedded inside ScrollView list layout) */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20, marginBottom: 6 }]}>
          Trending Discussions
        </Text>
        {loading ? (
          <LoadingState />
        ) : (
          trendingPosts.map((post) => (
            <FeedCard key={post._id} post={post} navigation={navigation} />
          ))
        )}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 16,
    marginVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
