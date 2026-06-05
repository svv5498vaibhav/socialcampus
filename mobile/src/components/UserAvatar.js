import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../theme/ThemeContext';

export default function UserAvatar({ userId, name = 'Student', avatarUrl, size = 40 }) {
  const { theme } = useTheme();
  
  // Dynamic subscription to online users set
  const isOnline = useUserStore((state) => state.onlineUsers.has(userId));

  const getInitials = (fullName) => {
    if (!fullName) return 'S';
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (username) => {
    // Return a stable theme-tailored background color based on name string
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getAvatarBg(name),
            },
          ]}
        >
          <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isOnline && (
        <View
          style={[
            styles.presenceDot,
            {
              backgroundColor: theme.success,
              borderColor: theme.card,
              width: Math.max(size * 0.28, 10),
              height: Math.max(size * 0.28, 10),
              borderRadius: Math.max(size * 0.14, 5),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
  },
});
