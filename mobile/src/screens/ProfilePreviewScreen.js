import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToAuthor, unsubscribeFromAuthor } from '../api/socketClient';
import apiClient from '../api/apiClient';
import FeedCard from '../components/FeedCard';
import UserAvatar from '../components/UserAvatar';
import { EmptyState, LoadingState } from '../components/StateViews';

export default function ProfilePreviewScreen({ route, navigation }) {
  const { userId } = route.params;
  const { theme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch student profile details (mock or from API)
        // Since we have profile endpoints, we fetch profile:
        const profResponse = await apiClient.get(`/profile/${userId}`).catch(() => null);
        const userDetails = profResponse?.data?.data || {
          userId: { _id: userId, firstName: 'Student', lastName: 'Profile', college: 'IIT Delhi', branch: 'Mechanical Engineering' },
          username: 'student_profile',
          bio: 'CampusX student researcher & mobile developer.',
          skills: ['Python', 'C++', 'CAD'],
          following: [],
          followers: []
        };
        
        setProfile(userDetails);
        
        // Fetch posts written by this user
        const postsResponse = await apiClient.get('/feed/for-you', { params: { limit: 20 } });
        const allPosts = postsResponse.data.data.posts || [];
        const userPosts = allPosts.filter(p => p.authorId && p.authorId._id === userId);
        setPosts(userPosts);
        
        // Set follow state
        setIsFollowing(userDetails.followers?.includes(userId) || false);
      } catch (err) {
        console.warn('Failed to load profile details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    
    const targetId = userId;
    try {
      const response = await apiClient.post(`/feed/follow/${targetId}`);
      const serverFollowing = response.data.data.isFollowing;
      
      setIsFollowing(serverFollowing);

      // Dynamically subscribe / unsubscribe socket follower rooms
      if (serverFollowing) {
        subscribeToAuthor(targetId);
      } else {
        unsubscribeFromAuthor(targetId);
      }
    } catch (err) {
      console.warn('Follow request failed:', err.message);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const fullName = profile.userId
    ? `${profile.userId.firstName} ${profile.userId.lastName}`
    : 'CampusX Student';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={[styles.profileHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            {/* Student Stats Info */}
            <View style={styles.avatarRow}>
              <UserAvatar userId={userId} name={fullName} avatarUrl={profile.avatarUrl} size={64} />
              <View style={styles.statsBlock}>
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: theme.text }]}>
                    {profile.followers?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: theme.text }]}>
                    {profile.following?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.name, { color: theme.text }]}>{fullName}</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {profile.userId?.branch} • @{profile.username || 'student'}
            </Text>
            <Text style={[styles.college, { color: theme.textSecondary }]}>
              {profile.userId?.college || 'CampusX College'}
            </Text>

            {profile.bio ? (
              <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
            ) : null}

            {/* Follow Actions Button */}
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing ? { backgroundColor: theme.border } : { backgroundColor: theme.primary },
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followBtnText, { color: isFollowing ? theme.text : '#FFFFFF' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <FeedCard post={item} navigation={navigation} />}
        ListEmptyComponent={<EmptyState message="No posts authored yet." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsBlock: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statCell: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  college: {
    fontSize: 11,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  followBtn: {
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  followBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
});
