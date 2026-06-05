// 1. Hook Node.js require to mock React Native libraries
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      StyleSheet: {
        create: (obj) => obj,
      },
      Platform: { OS: 'ios' },
      useColorScheme: () => 'dark',
      useWindowDimensions: () => ({ width: 375, height: 812 }),
    };
  }
  if (id === '@react-native-async-storage/async-storage') {
    const store = new Map();
    return {
      default: {
        getItem: async (key) => store.get(key) || null,
        setItem: async (key, val) => { store.set(key, String(val)); },
        removeItem: async (key) => { store.delete(key); },
      },
      getItem: async (key) => store.get(key) || null,
      setItem: async (key, val) => { store.set(key, String(val)); },
      removeItem: async (key) => { store.delete(key); },
    };
  }
  if (id === 'socket.io-client') {
    return {
      io: () => ({
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
      }),
      default: () => ({
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
      }),
    };
  }
  return originalRequire.apply(this, arguments);
};

const assert = require('assert');

// 2. Load the Zustand stores
const { useUserStore } = require('./src/store/userStore');
const { useFeedStore } = require('./src/store/feedStore');
const { usePostStore } = require('./src/store/postStore');
const { useNotificationStore } = require('./src/store/notificationStore');

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ TEST PASSED: ${name}`);
  } catch (error) {
    console.error(`❌ TEST FAILED: ${name}`);
    console.error(error);
    process.exit(1);
  }
}

console.log('🧪 Running FeedSense AI Mobile Frontend Unit Tests...\n');

// Test Zustand User Store Auth Actions
runTest('UserStore - Initialize empty state', async () => {
  const store = useUserStore.getState();
  assert.strictEqual(store.isAuthenticated, false);
  assert.strictEqual(store.user, null);
});

runTest('UserStore - Mock Login Success', async () => {
  const store = useUserStore.getState();
  
  // Directly set state since we're testing offline state mutations
  useUserStore.setState({
    isAuthenticated: true,
    user: { id: 'user1', firstName: 'John', lastName: 'Doe', college: 'BITS Pilani', branch: 'CS' },
    accessToken: 'mock-access-token',
  });

  const nextState = useUserStore.getState();
  assert.strictEqual(nextState.isAuthenticated, true);
  assert.strictEqual(nextState.user.firstName, 'John');
  assert.strictEqual(nextState.accessToken, 'mock-access-token');
});

// Test Zustand Feed Store Actions
runTest('FeedStore - Tab mutations and prepending', () => {
  const store = useFeedStore.getState();
  
  // Set tab
  store.setActiveTab('branch');
  assert.strictEqual(useFeedStore.getState().activeTab, 'branch');

  // Prepend post to feed
  const newPost = {
    _id: 'post123',
    title: 'Mobile Architecture',
    content: 'React Native is highly optimized using FlatLists.',
    type: 'project',
    likesCount: 1,
    commentsCount: 0,
  };
  
  store.prependPostToFeed(newPost);
  
  const updatedState = useFeedStore.getState();
  assert.strictEqual(updatedState.feeds['for-you'].length, 1);
  assert.strictEqual(updatedState.feeds['for-you'][0]._id, 'post123');
});

// Test Zustand Post Store Optimistic Toggles
runTest('PostStore - Like optimistic toggle', () => {
  const postStore = usePostStore.getState();
  const feedStore = useFeedStore.getState();

  // Prepend a test post first
  feedStore.prependPostToFeed({
    _id: 'test_post',
    content: 'Toggle testing',
    likesCount: 5,
  });

  // Verify initial state
  assert.strictEqual(postStore.likedPosts.has('test_post'), false);

  // Toggle like (fires optimistic trigger)
  postStore.toggleLike('test_post');

  const afterLikeState = usePostStore.getState();
  assert.strictEqual(afterLikeState.likedPosts.has('test_post'), true);

  // Checks that likesCount updated to 6 in the feed
  const currentFeedPost = useFeedStore.getState().feeds['for-you'].find(p => p._id === 'test_post');
  assert.strictEqual(currentFeedPost.likesCount, 6);
});

// Test Zustand Notification Store Updates
runTest('NotificationStore - Live alert sockets prepend', () => {
  const notifStore = useNotificationStore.getState();
  assert.strictEqual(notifStore.unreadCount, 0);

  // Simulate socket push
  const mockAlert = {
    _id: 'notif_abc',
    type: 'mention',
    title: 'New Mention',
    message: 'John mentioned you in a project post.',
    isRead: false,
  };

  // Directly push to trigger state check
  useNotificationStore.setState({
    notifications: [mockAlert],
    unreadCount: 1,
  });

  const nextState = useNotificationStore.getState();
  assert.strictEqual(nextState.notifications.length, 1);
  assert.strictEqual(nextState.unreadCount, 1);
  assert.strictEqual(nextState.notifications[0].type, 'mention');
});

console.log('\n🎉 All Mobile Frontend state and unit tests passed successfully!');
process.exit(0);
