import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonLoader() {
  const { theme } = useTheme();

  const CardSkeleton = () => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.border }]} />
        <View style={styles.headerLines}>
          <View style={[styles.lineShort, { backgroundColor: theme.border }]} />
          <View style={[styles.lineTiny, { backgroundColor: theme.border }]} />
        </View>
      </View>
      {/* Body Skeleton */}
      <View style={styles.body}>
        <View style={[styles.lineFull, { backgroundColor: theme.border }]} />
        <View style={[styles.lineFull, { backgroundColor: theme.border }]} />
        <View style={[styles.lineMed, { backgroundColor: theme.border }]} />
      </View>
      {/* Footer Actions Skeleton */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={[styles.button, { backgroundColor: theme.border }]} />
        <View style={[styles.button, { backgroundColor: theme.border }]} />
        <View style={[styles.button, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 6,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    height: 38,
    width: 38,
    borderRadius: 19,
  },
  headerLines: {
    marginLeft: 8,
    flex: 1,
  },
  lineShort: {
    height: 10,
    width: '40%',
    borderRadius: 4,
    marginBottom: 6,
  },
  lineTiny: {
    height: 8,
    width: '20%',
    borderRadius: 4,
  },
  body: {
    marginBottom: 12,
  },
  lineFull: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  lineMed: {
    height: 12,
    width: '70%',
    borderRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    height: 14,
    width: '20%',
    borderRadius: 4,
  },
});
