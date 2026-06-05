/**
 * Integration Test Suite for:
 * 1. Agent 6: BranchConnect AI
 * 2. Agent 7: CreatorBoost AI
 *
 * Run: node tests/testCollaborationAndContent.cjs (from server directory)
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDatabase = require('../config/database');

// Models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const CommunityPost = require('../models/CommunityPost');
const Event = require('../models/Event');
const Project = require('../models/Project');
const ProjectTeam = require('../models/ProjectTeam');
const Mentorship = require('../models/Mentorship');
const ContentPost = require('../models/ContentPost');
const ContentAnalytics = require('../models/ContentAnalytics');
const ContentCategory = require('../models/ContentCategory');
const Tag = require('../models/Tag');
const TeamMatch = require('../models/TeamMatch');
const CommunityRecommendation = require('../models/CommunityRecommendation');

// Services
const CollaborationService = require('../services/collaborationService');
const CreatorService = require('../services/creatorService');
const CommunityRecEngine = require('../services/communityRecEngine');
const TeamMatchingEngine = require('../services/teamMatchingEngine');
const MentorshipEngine = require('../services/mentorshipEngine');
const ContentHelperEngine = require('../services/contentHelperEngine');
const QualityEngine = require('../services/qualityEngine');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

async function runTests() {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB.\n');

    // Setup Test Users and Profiles
    await User.deleteMany({ email: { $in: ['alice@campusx.edu', 'bob@campusx.edu'] } });
    await Profile.deleteMany({});
    await Community.deleteMany({});
    await CommunityMember.deleteMany({});
    await CommunityPost.deleteMany({});
    await Event.deleteMany({});
    await Project.deleteMany({});
    await ProjectTeam.deleteMany({});
    await Mentorship.deleteMany({});
    await ContentPost.deleteMany({});
    await ContentAnalytics.deleteMany({});
    await ContentCategory.deleteMany({});
    await Tag.deleteMany({});
    await TeamMatch.deleteMany({});
    await CommunityRecommendation.deleteMany({});

    console.log('═══ STEP 0: Setup User Environment ═══');

    // Create User Alice (CSE, Sem 1)
    const aliceUser = await User.create({
      email: 'alice@campusx.edu',
      passwordHash: 'dummyhash',
      firstName: 'Alice',
      lastName: 'Smith',
      college: 'CampusX College',
      branch: 'CSE',
      semester: '1',
      role: 'student',
      status: 'active',
      emailVerified: true,
      isVerified: true,
    });
    const aliceProfile = await Profile.create({
      userId: aliceUser._id,
      username: 'alice_cse',
      bio: 'Enthusiastic first year computer student.',
      skills: ['HTML', 'CSS', 'JavaScript', 'React'],
      interests: ['Web Development', 'React', 'Node.js'],
      profileLevel: 'beginner',
      onboardingCompleted: true,
    });

    // Create User Bob (CSE, Sem 5)
    const bobUser = await User.create({
      email: 'bob@campusx.edu',
      passwordHash: 'dummyhash',
      firstName: 'Bob',
      lastName: 'Jones',
      college: 'CampusX College',
      branch: 'CSE',
      semester: '5',
      role: 'student',
      status: 'active',
      emailVerified: true,
      isVerified: true,
    });

    const bobProfile = await Profile.create({
      userId: bobUser._id,
      username: 'bob_pro',
      bio: 'Junior CSE student specializing in Backend and AI Systems.',
      skills: ['JavaScript', 'Node.js', 'Python', 'MongoDB', 'React'],
      interests: ['AI/ML', 'System Architecture', 'Backend Development'],
      profileLevel: 'advanced',
      onboardingCompleted: true,
    });

    assert(aliceUser._id !== undefined && bobUser._id !== undefined, 'Created Alice and Bob test users');
    console.log('');

    console.log('═══ TEST 1: Community System & Smart Recommendations ═══');

    // Create branch community
    const cseCommunity = await CollaborationService.createCommunity(bobUser._id, {
      name: 'CSE Branch Community',
      description: 'The official group for CSE students at CampusX',
      type: 'branch',
      topic: 'CSE',
      bannerUrl: 'http://banner.com/cse.png',
    });

    // Create technology community
    const reactCommunity = await CollaborationService.createCommunity(bobUser._id, {
      name: 'React Developers Hub',
      description: 'Learn and share frontend concepts with React.js',
      type: 'technology',
      topic: 'React',
      bannerUrl: 'http://banner.com/react.png',
    });

    // Alice joins React community
    const joinResult = await CollaborationService.joinCommunity(aliceUser._id, reactCommunity._id);
    assert(joinResult.alreadyMember === false && joinResult.record.role === 'member', 'Alice joins React Developers Hub');

    // Run Smart Community Recommendations for Alice
    const recs = await CollaborationService.getRecommendedCommunities(aliceUser._id);
    assert(recs.length > 0, 'Generated community recommendations list');
    
    // The top recommendation should be CSE branch community (due to branch match +45 score)
    const topRec = recs[0];
    assert(
      topRec.communityId.name === 'CSE Branch Community' && topRec.recommendationScore >= 45,
      `Recommend CSE Branch Community (Score: ${topRec.recommendationScore}, Reason: ${topRec.signals[0]})`
    );

    // Discussion post creation inside community
    const comPost = await CollaborationService.createPostInCommunity(
      aliceUser._id,
      reactCommunity._id,
      'Can anyone suggest resources for learning React Context API?'
    );
    assert(comPost._id !== undefined, 'Alice submits a community discussion post');

    const postsList = await CollaborationService.getCommunityPosts(reactCommunity._id);
    assert(postsList.docs.length === 1 && postsList.docs[0].content.includes('Context API'), 'Retrieved community posts list');
    console.log('');

    console.log('═══ TEST 2: Team Matching Engine & Collaboration ═══');

    // Bob creates a project recruitment team
    const team = await CollaborationService.createProjectTeam(bobUser._id, {
      name: 'CampusX Social Network Core',
      description: 'Building an enterprise student connection engine.',
      skillsRequired: ['Node.js', 'MongoDB', 'React'],
      interests: ['Backend Development', 'System Architecture'],
      projectGoals: 'Develop CampusX portal beta release',
      availability: '10 hrs/week',
      experienceLevel: 'intermediate',
    });

    assert(team._id !== undefined, 'Bob registers a project recruitment team');

    // Suggest teams for Alice
    const teamMatchesForAlice = await CollaborationService.getTeamSuggestions(aliceUser._id);
    assert(teamMatchesForAlice.length > 0, 'Found matching team suggestions for Alice');
    const matchedTeam = teamMatchesForAlice.find(m => {
      const tId = m.targetTeamId._id ? m.targetTeamId._id.toString() : m.targetTeamId.toString();
      return tId === team._id.toString();
    });
    assert(
      matchedTeam && matchedTeam.compatibilityScore > 0 && matchedTeam.matchedSkills.includes('React'),
      `Alice is compatible with Bob's team (Score: ${matchedTeam?.compatibilityScore}%, Matched Skill: React)`
    );
    // Suggest peers for Bob (who matches Bob's team requirements)
    const peerMatchesForBob = await CollaborationService.getTeammateSuggestions(bobUser._id);
    const matchedPeer = peerMatchesForBob.find(m => m.targetUserId._id.toString() === aliceUser._id.toString());
    assert(
      matchedPeer && matchedPeer.compatibilityScore > 0,
      `Alice is suggested to Bob as a teammate (Score: ${matchedPeer?.compatibilityScore}%)`
    );

    // Alice requests to join Bob's team
    const reqToJoin = await CollaborationService.joinOrInviteTeamMember(aliceUser._id, team._id, null, 'Frontend Intern', false);
    const pendingMember = reqToJoin.members.find(m => m.userId.toString() === aliceUser._id.toString());
    assert(pendingMember && pendingMember.status === 'pending', 'Alice requests to join (marked pending)');

    // Bob approves Alice's request
    const approvedTeam = await CollaborationService.approveTeamJoinRequest(bobUser._id, team._id, aliceUser._id, true);
    const joinedMember = approvedTeam.members.find(m => m.userId.toString() === aliceUser._id.toString());
    assert(joinedMember && joinedMember.status === 'joined', 'Bob approves Alice and status transitions to joined');
    console.log('');

    console.log('═══ TEST 3: Mentorship System ═══');

    // Suggest mentor candidates for Alice
    const mentorSuggestions = await CollaborationService.getMentorSuggestions(aliceUser._id);
    assert(mentorSuggestions.length > 0, 'Discovered mentor recommendations for Alice');
    
    const suggestedBob = mentorSuggestions.find(m => m.mentorId.toString() === bobUser._id.toString());
    assert(
      suggestedBob && suggestedBob.compatibilityScore >= 40 && suggestedBob.matchedTopics.includes('React'),
      `Bob suggested as mentor for Alice (Score: ${suggestedBob?.compatibilityScore}%, Topic: ${suggestedBob?.matchedTopics})`
    );

    // Alice requests mentorship from Bob
    const mentRequest = await CollaborationService.requestMentorship(
      aliceUser._id,
      bobUser._id,
      'Frontend Performance Optimization',
      'Learn virtual DOM optimization techniques.',
      'Help me improve my React render performance.'
    );
    assert(mentRequest._id !== undefined && mentRequest.status === 'pending', 'Alice submits mentorship request');

    // Bob accepts mentorship
    const acceptedMent = await CollaborationService.respondToMentorship(bobUser._id, mentRequest._id, true);
    assert(acceptedMent.status === 'accepted', 'Bob accepts mentorship request');

    // Bob schedules virtual session
    const scheduled = await CollaborationService.createMentorshipSession(
      bobUser._id,
      mentRequest._id,
      'Session 1: React DevTools and Render Profiling',
      new Date(Date.now() + 86400000), // tomorrow
      'https://meet.google.com/abc-xyz'
    );
    assert(scheduled.sessions.length === 1 && scheduled.sessions[0].meetingLink === 'https://meet.google.com/abc-xyz', 'Mentor schedules virtual session');

    // Complete session
    const compSession = await CollaborationService.completeMentorshipSession(bobUser._id, mentRequest._id, scheduled.sessions[0]._id);
    assert(compSession.sessions[0].completed === true, 'Mentor marks session as completed');

    // Alice reviews mentorship session
    const finalized = await CollaborationService.submitMentorshipFeedback(aliceUser._id, mentRequest._id, 5, 'Bob was incredibly helpful and gave great tips.');
    assert(finalized.status === 'completed' && finalized.feedback.rating === 5, 'Mentee reviews session and closes request');
    console.log('');

    console.log('═══ TEST 4: Event Collaboration ═══');

    // Bob creates a hackathon event linked to no community (global)
    const event = await CollaborationService.createEvent(bobUser._id, {
      title: 'CampusX Code Jam 2026',
      description: 'Vibrant student hackathon to build open projects.',
      type: 'hackathon',
      mode: 'online',
      venueOrLink: 'https://zoom.us/hackathon',
      startTime: new Date(Date.now() + 2 * 86400000),
      endTime: new Date(Date.now() + 3 * 86400000),
      registrationDeadline: new Date(Date.now() + 86400000),
    });
    assert(event._id !== undefined, 'Bob creates Hackathon event');

    // Alice registers for the event
    const registered = await CollaborationService.registerForEvent(aliceUser._id, event._id);
    assert(registered.registeredMembers.some(m => m.userId.toString() === aliceUser._id.toString()), 'Alice registers for Hackathon');

    // Attendance tracking
    const markedAtt = await CollaborationService.markAttendance(bobUser._id, event._id, aliceUser._id, true);
    assert(markedAtt.registeredMembers.find(m => m.userId.toString() === aliceUser._id.toString()).attended === true, 'Bob marks Alice as attended');
    console.log('');

    console.log('═══ TEST 5: CreatorBoost AI Post & Project Publishing ═══');

    // Alice publishes a portfolio project
    const projectPublish = await CreatorService.publishProject(aliceUser._id, {
      title: 'CampusX Portfolio Builder',
      description: 'A React-based web tool where college students build portfolios and export resumes.',
      techStack: ['React', 'CSS', 'JavaScript'],
      githubLink: 'https://github.com/alice/portfolio-builder',
      demoLink: 'https://campusx-builder.vercel.app',
      documentation: '# Portfolios\nThis is a student dashboard app.',
    });

    assert(projectPublish.project._id !== undefined, 'Alice publishes project showcase');
    assert(projectPublish.quality.qualityScore > 60 && projectPublish.quality.hasGithub === true, `Evaluated project quality: ${projectPublish.quality.qualityScore}% (GitHub: ${projectPublish.quality.hasGithub})`);

    // Increment like and view
    const pDetails = await CreatorService.getProjectDetails(projectPublish.project._id);
    assert(pDetails.viewsCount === 1, 'Project view incremented on lookup');

    // Bob publishes a blog post
    const blogPost = await CreatorService.publishContentPost(bobUser._id, {
      title: 'Guide to Clean Architecture in Node.js Applications',
      content: 'This backend development blog explores standard repositories pattern, controllers separation, and clean layers in Express codebases. i dont recommend using spaghetti methods.',
      type: 'blog',
    });
    assert(blogPost._id !== undefined, 'Bob publishes a blog post');
    assert(blogPost.category === 'Web Development', `Category auto-detected: ${blogPost.category}`);
    assert(blogPost.tags.includes('javascript') && blogPost.tags.includes('webdev'), `Hashtags auto-generated: ${blogPost.tags}`);
    assert(blogPost.aiSuggestions.grammarCorrections.length > 0, 'Grammar errors flagged: i -> I, dont -> don\'t');
    assert(blogPost.aiSuggestions.summary.length > 0, 'AI summary auto-generated');
    assert(blogPost.aiSuggestions.captionSuggestions.length > 0, 'LinkedIn caption suggestions generated');
    console.log('');

    console.log('═══ TEST 6: Real-Time Engagement, Hovers & Analytics ═══');

    // Track analytics (Views, unique visits, scroll depth, hover durations)
    await CreatorService.trackPostHoverAndMetrics(blogPost._id, {
      views: 1,
      uniqueVisitor: true,
      readingDurationMs: 45000,
      scrollDepthPercent: 85,
    });

    // Track hover metrics
    await CreatorService.trackPostHoverAndMetrics(blogPost._id, {
      hover: true,
      hoverDurationMs: 1200,
    });

    // Like post
    await CreatorService.incrementPostLike(blogPost._id);

    // Retrieve creator analytics dashboard for Bob
    const dashboard = await CreatorService.getCreatorDashboard(bobUser._id);
    assert(dashboard.metrics.totalViews === 1 && dashboard.metrics.postsTracked === 1, 'Analytics aggregated on creator dashboard');
    assert(
      dashboard.metrics.avgReadingDurationMs === 45000 && dashboard.metrics.avgScrollDepthPercent === 85,
      `Scroll depth (${dashboard.metrics.avgScrollDepthPercent}%) and reading duration (${dashboard.metrics.avgReadingDurationMs}ms) recorded`
    );

    const postAnalytics = await CreatorService.getPostAnalyticsDetails(blogPost._id);
    assert(postAnalytics.hoverMetrics.totalHovers === 1 && postAnalytics.hoverMetrics.avgHoverDurationMs === 1200, 'Hover analytics metrics tracked');

    // AI Writing Assistant tips standalone endpoint
    const tips = CreatorService.getWritingAssistantTips(
      'Clean Code Python',
      'Always write clean functions. cant use global variables. teh code receives input.',
      'blog'
    );
    assert(tips.grammarCorrections.some(g => g.reason.includes('apostrophe')), 'Standalone helper tags grammar errors');
    assert(tips.tags.includes('python'), 'Standalone helper detects tags');
    console.log('');

    console.log('═══ CLEANUP ═══');
    await User.deleteMany({ email: { $in: ['alice@campusx.edu', 'bob@campusx.edu'] } });
    await Profile.deleteMany({});
    await Community.deleteMany({});
    await CommunityMember.deleteMany({});
    await CommunityPost.deleteMany({});
    await Event.deleteMany({});
    await Project.deleteMany({});
    await ProjectTeam.deleteMany({});
    await Mentorship.deleteMany({});
    await ContentPost.deleteMany({});
    await ContentAnalytics.deleteMany({});
    await ContentCategory.deleteMany({});
    await Tag.deleteMany({});
    await TeamMatch.deleteMany({});
    await CommunityRecommendation.deleteMany({});
    console.log('  🧹 Cleaned up test data.');
    console.log('');

    console.log('═══════════════════════════════════════════');
    console.log('  COLLABORATION & CREATOR MODULES TESTS SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:   ${passed + failed}`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All BranchConnect & CreatorBoost tests passed successfully!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner crashed:', error);
    process.exit(1);
  }
}

runTests();
