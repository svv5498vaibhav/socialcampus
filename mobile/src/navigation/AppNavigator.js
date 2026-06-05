import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useUserStore } from '../store/userStore';
import { useTheme } from '../theme/ThemeContext';

import TabNavigator from './TabNavigator';
import PostDetailScreen from '../screens/PostDetailScreen';
import ProfilePreviewScreen from '../screens/ProfilePreviewScreen';
import LoginScreen from '../screens/LoginScreen'; // Simple auth input screen

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, initialize } = useUserStore();
  const { theme } = useTheme();

  // Initialize store and reload authentication state
  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.tabBar,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{ title: 'Discussion' }}
            />
            <Stack.Screen
              name="ProfilePreview"
              component={ProfilePreviewScreen}
              options={{ title: 'Student Profile' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
