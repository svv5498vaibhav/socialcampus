import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function TrendingCard({ title, subtitle, rank, onPress, type = 'tag' }) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.rankBadge, { backgroundColor: theme.primaryLight }]}>
        <Text style={[styles.rankText, { color: theme.primary }]}>#{rank}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
          {type === 'tag' ? `#${title}` : title}
        </Text>
        <Text style={[styles.subtitleText, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.typeBadge, { backgroundColor: theme.badgeBg }]}>
        <Text style={[styles.typeText, { color: theme.badgeText }]}>
          {type.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  rankBadge: {
    height: 32,
    width: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  subtitleText: {
    fontSize: 11,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  typeText: {
    fontSize: 8,
    fontWeight: '700',
  },
});
