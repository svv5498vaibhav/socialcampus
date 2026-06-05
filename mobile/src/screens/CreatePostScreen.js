import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useFeedStore } from '../store/feedStore';
import apiClient from '../api/apiClient';

export default function CreatePostScreen({ navigation }) {
  const { theme } = useTheme();
  const { fetchFeed } = useFeedStore();

  const [type, setType] = useState('discussion'); // discussion, project, poll, event, internship
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (text, index) => {
    const nextOptions = [...pollOptions];
    nextOptions[index] = text;
    setPollOptions(nextOptions);
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert('Required Fields', 'Please type some content for your post.');
      return;
    }

    setLoading(true);

    const payload = {
      title,
      content,
      metadata: {},
    };

    if (type === 'project') {
      const techStack = techStackInput.split(',').map((t) => t.trim()).filter(Boolean);
      payload.metadata = {
        techStack,
        githubLink: githubLink.trim(),
      };
    } else if (type === 'poll') {
      const options = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) {
        Alert.alert('Required Fields', 'Please provide at least 2 options for your poll.');
        setLoading(false);
        return;
      }
      payload.metadata = {
        pollOptions: options.map((opt) => ({ text: opt, votes: [] })),
      };
    }

    try {
      await apiClient.post('/feed/posts', payload);
      Alert.alert('Success', 'Your post is published on CampusX!', [
        {
          text: 'Awesome',
          onPress: () => {
            // Force feed reload to pull the new post
            fetchFeed('for-you', true);
            // Reset state
            setTitle('');
            setContent('');
            setTechStackInput('');
            setGithubLink('');
            setPollOptions(['', '']);
            setType('discussion');
            // Navigate back to home feed tab
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (type) {
      case 'project':
        return (
          <View style={styles.additionalFields}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Tech Stack (comma separated)</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
              placeholder="React, Node.js, PyTorch"
              placeholderTextColor={theme.textSecondary}
              value={techStackInput}
              onChangeText={setTechStackInput}
            />

            <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 12 }]}>GitHub Repository Link</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
              placeholder="github.com/your-username/repo"
              placeholderTextColor={theme.textSecondary}
              value={githubLink}
              onChangeText={setGithubLink}
              autoCapitalize="none"
            />
          </View>
        );

      case 'poll':
        return (
          <View style={styles.additionalFields}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Poll Options</Text>
            {pollOptions.map((opt, index) => (
              <TextInput
                key={index}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, marginTop: 6 },
                ]}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={theme.textSecondary}
                value={opt}
                onChangeText={(text) => handlePollOptionChange(text, index)}
              />
            ))}
            {pollOptions.length < 5 && (
              <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddPollOption}>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>+ Add Option</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const renderTypeSelectorButton = (typeId, label) => {
    const isSelected = type === typeId;
    return (
      <TouchableOpacity
        style={[
          styles.typeBtn,
          { borderColor: theme.border },
          isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.card },
        ]}
        onPress={() => setType(typeId)}
      >
        <Text style={[styles.typeBtnText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.tabBar }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Compose Post</Text>
        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: theme.primary }]}
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.publishBtnText}>{loading ? 'Publishing...' : 'Publish'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Post Type Selection */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Type</Text>
        <View style={styles.typeSelectorRow}>
          {renderTypeSelectorButton('discussion', 'Discussion')}
          {renderTypeSelectorButton('project', 'Project')}
          {renderTypeSelectorButton('poll', 'Poll')}
        </View>

        {/* Content Fields */}
        <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Title (Optional)</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
          placeholder="Enter a descriptive title"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 12 }]}>Content</Text>
        <TextInput
          style={[
            styles.textArea,
            { borderColor: theme.border, color: theme.text, backgroundColor: theme.card },
          ]}
          placeholder="Share your thoughts, projects, or questions with the campus..."
          placeholderTextColor={theme.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {renderFormFields()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
  },
  additionalFields: {
    marginTop: 12,
  },
  addOptionBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});
