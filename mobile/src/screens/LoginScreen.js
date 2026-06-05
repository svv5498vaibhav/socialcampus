import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../theme/ThemeContext';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login, loading, error } = useUserStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please fill in both email and password.');
      return;
    }
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Authentication Error', err.message || 'Incorrect credentials.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentCard}>
        <Text style={[styles.logo, { color: theme.primary }]}>CampusX</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Verified Student Social Feed
        </Text>

        <View style={styles.form}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>College Email</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="student@college.edu"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.inputLabel, { color: theme.text, marginTop: 12 }]}>Password</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="••••••••"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  contentCard: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  loginBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
