import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const LoadingState = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

export const EmptyState = ({ message = 'No posts found in this feed yet.' }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={[styles.emoji, { color: theme.textSecondary }]}>📭</Text>
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
};

export const ErrorState = ({ message = 'Something went wrong. Please try again.', onRetry }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={[styles.emoji, { color: theme.danger }]}>⚠️</Text>
      <Text style={[styles.title, { color: theme.text }]}>Network Error</Text>
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
