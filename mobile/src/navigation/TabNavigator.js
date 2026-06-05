import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import TrendingScreen from '../screens/TrendingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

// Premium, lightweight, asset-free visual icons
const TabIcon = ({ focused, color, type }) => {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconDot,
          { backgroundColor: color },
          focused ? styles.iconDotActive : null,
          type === 'create' ? styles.iconCreate : null,
        ]}
      />
    </View>
  );
};

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.iconInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} type="home" />,
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} type="search" />,
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} type="create" />,
          tabBarLabel: 'Create',
        }}
      />
      <Tab.Screen
        name="Trending"
        component={TrendingScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} type="trending" />,
          tabBarLabel: 'Trending',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} type="notifications" />,
          tabBarLabel: 'Alerts',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    width: 24,
  },
  iconDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  iconDotActive: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  iconCreate: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
