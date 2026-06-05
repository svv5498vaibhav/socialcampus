import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore } from '../store/notificationStore';
import UserAvatar from './UserAvatar';

export default function NotificationCard({ notification, navigation }) {
  const { theme } = useTheme();
  const { markNotificationsAsRead } = useNotificationStore();

  const handlePress = async () => {
    // Mark as read locally and on server
    if (!notification.isRead) {
      await markNotificationsAsRead(notification._id);
    }
    
    // Navigate to post details if available
    if (notification.postId) {
      navigation.navigate('PostDetail', { postId: notification.postId });
    }
  };

  const getEmoji = (type) => {
    switch (type) {
      case 'like':
        return '👍';
      case 'comment':
        return '💬';
      case 'mention':
        return '🏷️';
      case 'follow':
        return '👥';
      case 'trending':
        return '🔥';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const senderName = notification.senderId
    ? `${notification.senderId.firstName} ${notification.senderId.lastName}`
    : 'System';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: notification.isRead ? theme.card : theme.primaryLight,
          borderColor: theme.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <UserAvatar
        userId={notification.senderId?._id || ''}
        name={senderName}
        avatarUrl={notification.senderId?.avatarUrl}
        size={36}
      />
      <View style={styles.contentBlock}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
            {notification.title} {getEmoji(notification.type)}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTimestamp(notification.createdAt)}
          </Text>
        </View>
        <Text style={[styles.messageText, { color: theme.textSecondary }]} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
      {!notification.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  contentBlock: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
  },
  timeText: {
    fontSize: 10,
    marginLeft: 6,
  },
  messageText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
