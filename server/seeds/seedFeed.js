const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDatabase = require('../config/database');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const FeedService = require('../services/feedService');

const mockPostsData = [
  {
    title: 'MERN Stack Campus Marketplace',
    content: 'I built a full-stack campus marketplace application where students can buy/sell textbook materials, lab coats, and electronics. The app uses React for the frontend, Node/Express for the API, and MongoDB for database. Check out the repository and deploy link!',
    type: 'project',
    metadata: {
      githubLink: 'github.com/campusx-dev/marketplace',
      demoLink: 'campus-market.vercel.app',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'TailwindCSS']
    }
  },
  {
    title: 'Poll: What programming language should we use for the coding club hackathon?',
    content: 'We are organizing the annual CampusX Hackathon next month. To make it fair and set up the compiler environments, what is your primary programming language of choice?',
    type: 'poll',
    metadata: {
      options: [
        { optionText: 'Python (Fast, rich libraries)', votes: [] },
        { optionText: 'Java (OOP, enterprise scale)', votes: [] },
        { optionText: 'C++ (Optimized, competitive programming)', votes: [] },
        { optionText: 'JavaScript/TypeScript (Full stack ready)', votes: [] }
      ]
    }
  },
  {
    title: 'Google STEP Internship 2026',
    content: 'Google is hiring first and second-year CS students for the Software Engineering STEP Internship program. This is a 12-week internship focused on development. Applications close next week!',
    type: 'internship',
    metadata: {
      company: 'Google LLC',
      role: 'STEP Intern 2026',
      stipend: 'Competitive',
      location: 'Bangalore, India',
      applicationDeadline: new Date(Date.now() + 10 * 86400 * 1000)
    }
  },
  {
    title: 'Workshop: Machine Learning in Production',
    content: 'Join us this Saturday for a hands-on workshop on deploying Machine Learning models using Docker and AWS. We will deploy a PyTorch object detection model. Limited seats available, RSVP now!',
    type: 'event',
    metadata: {
      eventDate: new Date(Date.now() + 5 * 86400 * 1000),
      venue: 'Auditorium Hall B',
      registrationLink: 'forms.gle/campusx-ml-deploy'
    }
  },
  {
    title: 'Mastering DSA Cheat Sheet',
    content: 'Here is a curated cheat sheet containing 75 essential DSA patterns and LeetCode problems organized by difficulty. Includes links to tutorials and reference sheets. Perfect for placement prep!',
    type: 'resource',
    metadata: {}
  },
  {
    title: 'Secured Rank 12 in ACM ICPC Regionals',
    content: 'Extremely proud to share that our team "Antigravity Devs" secured Rank 12 out of 180 teams in the ICPC Regionals. Huge thanks to our college coding club and mentors for supporting us throughout this journey!',
    type: 'achievement',
    metadata: {}
  }
];

async function seed() {
  try {
    await connectDatabase();
    console.log('✅ Connected to database.');

    // 1. Fetch some existing users to set as authors
    const users = await User.find({}).limit(5);
    if (users.length === 0) {
      console.log('⚠️ No users found in database. Please run signup/register first, or create admin user.');
      process.exit(0);
    }

    console.log(`Found ${users.length} users in the database to act as post authors.`);

    // 2. Clear old posts
    const deleteCount = await Post.deleteMany({});
    console.log(`🧹 Deleted ${deleteCount.deletedCount} existing posts.`);

    // 3. Inject mock posts using FeedService to run full AI classification/scoring pipelines
    for (let i = 0; i < mockPostsData.length; i++) {
      const mockData = mockPostsData[i];
      // Rotate authors
      const author = users[i % users.length];

      console.log(`Publishing post "${mockData.title || 'Discussion'}" by user ${author.email}...`);

      const post = await FeedService.createPost(
        author._id,
        {
          title: mockData.title,
          content: mockData.content,
          mediaUrls: [],
          metadata: mockData.metadata
        },
        author.role
      );

      console.log(`   └─ Classified as: ${post.type}`);
      console.log(`   └─ Quality Score: ${post.qualityScore}/100`);
      console.log(`   └─ Summary: "${post.aiSummary}"`);
      console.log(`   └─ Hashtags: ${post.hashtags.map(h => `#${h}`).join(' ')}\n`);
    }

    console.log('🎉 Seeding FeedSense AI database completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
