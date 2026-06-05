import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';
import NotificationCard from '../components/NotificationCard';
import { EmptyState } from '../components/StateViews';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const { accessToken } = useUserStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationsAsRead,
    setupNotificationSocket,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();

    if (accessToken) {
      setupNotificationSocket(accessToken);
    }
  }, [accessToken]);

  const handleMarkAllRead = () => {
    markNotificationsAsRead(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.tabBar }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationCard notification={item} navigation={navigation} />
        )}
        onRefresh={() => { fetchNotifications(true); fetchUnreadCount(); }}
        refreshing={false}
        ListEmptyComponent={<EmptyState message="Your alerts box is empty." />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 6,
  },
});
