const assert = require('assert');
const ContentClassifier = require('../services/contentClassifier');
const QualityScoringEngine = require('../services/qualityScoringEngine');
const SpamDetector = require('../services/spamDetector');
const PostSummarizer = require('../services/postSummarizer');
const HashtagEngine = require('../services/hashtagEngine');

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

console.log('🧪 Running FeedSense AI Phase 3 Unit Tests...\n');

// 1. Content Classifier Tests
runTest('ContentClassifier - Auto internship categorization', () => {
  const result = ContentClassifier.classify(
    'Winter Internships',
    'Join our backend engineering team. Apply now for this remote internship!',
    {},
    'student'
  );
  assert.strictEqual(result, 'internship');
});

runTest('ContentClassifier - Auto question categorization', () => {
  const result = ContentClassifier.classify(
    'React Router crash',
    'How do I handle nested routes without white screen?',
    {},
    'student'
  );
  assert.strictEqual(result, 'question');
});

// 2. Quality Scoring Tests
runTest('QualityScoringEngine - Basic heuristics scoring', () => {
  const score = QualityScoringEngine.calculate(
    'React App',
    'I built an app with React and Node.js. Repo link: github.com/test/repo',
    'project',
    [],
    { githubLink: 'github.com/test/repo', techStack: ['React', 'Node.js'] }
  );
  // Expected high score due to tech stack, github link, content length
  assert.ok(score >= 40, `Expected score >= 40, got ${score}`);
});

runTest('QualityScoringEngine - Dynamic score adjustment', () => {
  const baseScore = 50;
  // High engagement view ratio
  const highEngagement = QualityScoringEngine.calculateDynamicScore(baseScore, {
    views: 100,
    likes: 30,
    comments: 10,
    saves: 5
  });
  assert.strictEqual(highEngagement, 70); // 50 + 20

  // Clickbait / Zero engagement ratio
  const lowEngagement = QualityScoringEngine.calculateDynamicScore(baseScore, {
    views: 100,
    likes: 0,
    comments: 0
  });
  assert.strictEqual(lowEngagement, 35); // 50 - 15
});

// 3. Spam Detector Tests
runTest('SpamDetector - Spam keyword trigger', () => {
  // Directly call internal helper since detectSpam returns a promise
  // We check duplicate algorithm or string similarity helper
  const sim = SpamDetector.calculateTextSimilarity(
    'This is a react application built using express and node',
    'This is a React app constructed with Node and Express framework'
  );
  assert.ok(sim >= 0.5, `Expected similarity >= 0.5, got ${sim}`);
});

// 4. Summarizer Tests
runTest('PostSummarizer - Sentence summarization', () => {
  const summary = PostSummarizer.summarize(
    'Docker tutorial',
    'Learn how to run containers using docker run. Docker is an open source platform that automates deploying applications. We will look at images and volumes.',
    'resource'
  );
  assert.ok(summary.includes('Docker tutorial'), 'Expected summary to contain context title');
});

// 5. Hashtag Engine Tests
runTest('HashtagEngine - Auto tagging', () => {
  const tags = HashtagEngine.generate(
    'Computer Vision model',
    'Developing object classification systems using PyTorch and OpenCV. #AI',
    'project'
  );
  console.log('   Generated tags for test:', tags);
  assert.ok(tags.includes('opencv'), 'Expected opencv hashtag');
  assert.ok(tags.includes('pytorch'), 'Expected pytorch hashtag');
  assert.ok(tags.includes('ai'), 'Expected ai hashtag from body extraction');
});

console.log('\n🎉 All Phase 3 Unit Tests completed successfully!');
