import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDarkMode, theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.tabBar}
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
