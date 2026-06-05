import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import apiClient from '../api/apiClient';
import FeedCard from '../components/FeedCard';
import UserAvatar from '../components/UserAvatar';
import { EmptyState, LoadingState } from '../components/StateViews';

export default function SearchScreen({ navigation }) {
  const { theme } = useTheme();
  
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('posts'); // posts, students
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // In a real environment, we'd query search-specific routes.
      // For testing, we load feeds matching filters or search matching profiles.
      if (filter === 'posts') {
        const response = await apiClient.get('/feed/for-you', { params: { limit: 20 } });
        const list = response.data.data.posts || [];
        const filtered = list.filter((p) =>
          p.content.toLowerCase().includes(text.toLowerCase()) ||
          (p.title && p.title.toLowerCase().includes(text.toLowerCase()))
        );
        setResults(filtered);
      } else {
        // Mock matching students
        setResults([
          { _id: 'mock1', firstName: 'Aarav', lastName: 'Sharma', branch: 'Computer Science', username: 'aarav_s' },
          { _id: 'mock2', firstName: 'Ananya', lastName: 'Iyer', branch: 'Information Technology', username: 'ananya_i' }
        ].filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(text.toLowerCase())));
      }
    } catch (err) {
      console.warn('Search query failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.tabBar }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
          placeholder="Search CampusX..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            filter === 'posts' ? { backgroundColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => { setFilter('posts'); setResults([]); setQuery(''); }}
        >
          <Text style={{ color: filter === 'posts' ? '#FFFFFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            filter === 'students' ? { backgroundColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => { setFilter('students'); setResults([]); setQuery(''); }}
        >
          <Text style={{ color: filter === 'students' ? '#FFFFFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>
            Students
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Viewport */}
      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            if (filter === 'posts') {
              return <FeedCard post={item} navigation={navigation} />;
            }
            // Render student result row
            const fullName = `${item.firstName} ${item.lastName}`;
            return (
              <TouchableOpacity
                style={[styles.userRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
                onPress={() => navigation.navigate('ProfilePreview', { userId: item._id })}
              >
                <UserAvatar userId={item._id} name={fullName} size={32} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>{fullName}</Text>
                  <Text style={[styles.userBranch, { color: theme.textSecondary }]}>
                    {item.branch} • @{item.username}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<EmptyState message={query ? "No matches found." : "Type keywords to search."} />}
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
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  userBranch: {
    fontSize: 11,
    marginTop: 2,
  },
});
