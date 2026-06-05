import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function BranchBadge({ branch = 'General', size = 'small' }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
      <Text
        style={[
          styles.badgeText,
          {
            color: theme.badgeText,
            fontSize: size === 'small' ? 10 : 12,
          },
        ]}
      >
        {branch}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});
