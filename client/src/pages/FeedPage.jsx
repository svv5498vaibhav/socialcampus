import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import RecommendationPanel from '../components/RecommendationPanel';
import Navbar from '../components/Navbar';

export default function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('for-you');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostsAlert, setNewPostsAlert] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [creatorStats, setCreatorStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const socketRef = useRef(null);

  const tabs = [
    { id: 'for-you', label: '✨ For You' },
    { id: 'following', label: '👥 Following' },
    { id: 'branch', label: '🏫 My Branch' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'projects', label: '💻 Projects' },
    { id: 'internships', label: '💼 Internships' },
    { id: 'events', label: '📅 Events' }
  ];

  // 1. Socket connection and listeners
  useEffect(() => {
    // Connect to server
    socketRef.current = io(window.location.origin || 'http://localhost:5000');

    // Authenticate socket
    if (user && user.id) {
      socketRef.current.emit('authenticate', user.id);
    }

    // Live engagement updates
    socketRef.current.on('engagement-update', (data) => {
      const { postId, likesCount, commentsCount, sharesCount, savesCount } = data;
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, likesCount, commentsCount, sharesCount, savesCount }
            : post
        )
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => ({ ...prev, likesCount, commentsCount, sharesCount, savesCount }));
      }
    });

    // Live new post notifications
    socketRef.current.on('new-post', (data) => {
      // Don't show alert if the author is current user
      // (as it will be prepended manually)
      // Check tab matches post type or if it is "for-you"
      setNewPostsAlert(prev => {
        if (prev.some(p => p.postId === data.postId)) return prev;
        return [data, ...prev];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, selectedPost]);

  // 2. Fetch feed posts
  const fetchFeed = async (tabName, pageNum, append = false) => {
    setIsLoading(true);
    try {
      const response = await guardianApi.getFeed(tabName, pageNum);
      const { posts: newPosts, hasMore: more } = response.data.data;
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setHasMore(more);
    } catch (error) {
      toast.error('Failed to load feed');
      // Mock posts on network failure so user is never stuck
      if (!append) {
        setPosts(getMockPosts(tabName));
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch recommendations & opportunity widgets
  const loadSidebarWidgets = async () => {
    try {
      const [recRes, opRes] = await Promise.all([
        guardianApi.getFeedRecommendations(),
        guardianApi.getOpportunities()
      ]);
      setRecommendations(recRes.data.data);
      setOpportunities(opRes.data.data);
    } catch {
      // Fallback mocks
      setRecommendations(getMockRecommendations());
      setOpportunities(getMockOpportunities());
    }
  };

  const loadCreatorStats = async () => {
    try {
      const res = await guardianApi.getCreatorAnalytics();
      setCreatorStats(res.data.data);
    } catch {
      setCreatorStats(getMockCreatorStats());
    }
  };

  // Fetch when tab changes
  useEffect(() => {
    setPage(1);
    setNewPostsAlert([]);
    fetchFeed(activeTab, 1, false);
  }, [activeTab]);

  // Initial load for widgets
  useEffect(() => {
    loadSidebarWidgets();
    loadCreatorStats();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(activeTab, nextPage, true);
  };

  const handleRefreshAlert = () => {
    setPage(1);
    setNewPostsAlert([]);
    fetchFeed(activeTab, 1, false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <Navbar />

      {/* Main View Grid */}
      <div className="dashboard-content feed-grid-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-md)' }}>
        
        {/* Left Column: Mini Profile Widget */}
        <div className="feed-col-left">
          <div className="card text-center" style={{ padding: 'var(--space-md)' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto var(--space-sm) auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '2px solid rgba(255,255,255,0.1)' }}>
              🎓
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{user?.firstName} {user?.lastName}</h3>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-md)' }}>{user?.branch} • Sem {user?.semester}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
              <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard/profile')}>
                👤 View Full Profile
              </button>
              <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.8rem' }} onClick={() => { loadCreatorStats(); setShowStatsModal(true); }}>
                📊 Creator Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Feed Postings */}
        <div className="feed-col-center">
          
          {/* Post Creation Box Trigger */}
          <div className="card post-create-trigger" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--space-md)', cursor: 'pointer', background: '#1e293b', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              ✍️
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '99px', padding: '10px 18px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Share a project, internship opportunity, resource, or ask a question...
            </div>
          </div>

          {/* New Posts Alert Banner */}
          {newPostsAlert.length > 0 && (
            <button className="btn btn-primary btn-sm new-posts-banner" onClick={handleRefreshAlert} style={{ width: '100%', margin: 'var(--space-md) 0', animation: 'pulse 2s infinite' }}>
              🔄 {newPostsAlert.length} new post{newPostsAlert.length > 1 ? 's' : ''} available. Click to refresh!
            </button>
          )}

          {/* Feed Navigation Tabs */}
          <div className="feed-tabs-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0', margin: 'var(--space-lg) 0 var(--space-md) 0' }}>
            {tabs.map(tab => (
              <button key={tab.id} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ whiteSpace: 'nowrap', borderRadius: '99px' }} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Timeline View */}
          <div className="feed-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  userId={user?.id}
                  onClick={() => setSelectedPost(post)}
                  onUpdate={(updated) => setPosts(prev => prev.map(p => p._id === updated._id ? updated : p))}
                />
              ))
            ) : (
              !isLoading && (
                <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <p className="text-muted">No posts available in this tab yet.</p>
                </div>
              )
            )}

            {isLoading && (
              <div className="loader-container" style={{ padding: 'var(--space-lg)' }}>
                <div className="loader"></div>
                <p className="loader-text text-sm">Loading feed...</p>
              </div>
            )}

            {hasMore && !isLoading && (
              <button className="btn btn-ghost btn-sm" onClick={handleLoadMore} style={{ margin: 'var(--space-md) auto' }}>
                Load More Posts
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations Panel */}
        <div className="feed-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* AI Recommendations Panel */}
          <RecommendationPanel
            recommendations={recommendations}
            onFollowUpdate={() => {
              loadSidebarWidgets();
              fetchFeed(activeTab, 1, false);
            }}
          />

          {/* AI Recommended Opportunities */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h2 className="card-title" style={{ fontSize: '0.95rem', marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎯 Matching Opportunities</span>
              <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>AI</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {opportunities && opportunities.length > 0 ? (
                opportunities.slice(0, 4).map(op => (
                  <div key={op._id} className="feed-widget-item" style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedPost(op)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`badge ${op.type === 'internship' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                        {op.type}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>
                        {op.opportunityScore}% match
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px', color: 'var(--color-text-primary)' }}>
                      {op.title}
                    </h4>
                    <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
                      {op.metadata?.company || op.metadata?.venue || 'CampusX'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">No opportunities matched yet. Update your skills in profile!</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals Overlay ── */}

      {/* Creator Analytics Modal */}
      {showStatsModal && creatorStats && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content card" style={{ maxWidth: '650px', background: 'rgba(11, 14, 38, 0.95)', border: '1px solid var(--color-primary-dark)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title">📊 Creator Performance Dashboard</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStatsModal(false)}>❌</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: 'var(--space-md) 0' }}>
              <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <p className="text-xs text-muted">Total Impressions</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>{creatorStats.totalImpressions}</h3>
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <p className="text-xs text-muted">Unique Reach</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>{creatorStats.totalReach}</h3>
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <p className="text-xs text-muted">Avg. Watch Time</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{creatorStats.averageWatchTime}s</h3>
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <p className="text-xs text-muted">Engagement Rate</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)' }}>{creatorStats.engagementRate}%</h3>
              </div>
            </div>

            {creatorStats.demographics && creatorStats.demographics.length > 0 && (
              <div style={{ margin: 'var(--space-md) 0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Audience Reach by Branch</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {creatorStats.demographics.map(demo => (
                    <div key={demo.branch}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                        <span>{demo.branch}</span>
                        <span>{demo.percentage}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${demo.percentage}%`, height: '100%', background: 'var(--gradient-primary)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowStatsModal(false)}>Close Analytics</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPublished={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setShowCreateModal(false);
            loadSidebarWidgets(); // refresh recommendations
            toast.success('Post published!');
          }}
        />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          userId={user?.id}
          onClose={() => setSelectedPost(null)}
          onUpdate={(updated) => {
            setSelectedPost(updated);
            setPosts(prev => prev.map(p => p._id === updated._id ? updated : p));
          }}
        />
      )}

    </div>
  );
}

// ── Mock Fallback Creators ──
function getMockPosts(tab) {
  return [
    {
      _id: 'mock_1',
      title: 'AI Attendance System using OpenCV & Face Recognition',
      content: 'I built an automated attendance tracking application using OpenCV, MTCNN for face detection, and FaceNet for recognition. It syncs with a MongoDB backend. The system marks students present when they enter the classroom and sends a summary report to professors. Here is the source code, open to feedback!',
      type: 'project',
      mediaUrls: [],
      hashtags: ['opencv', 'ai', 'computervision', 'mongodb'],
      qualityScore: 92,
      likesCount: 18,
      commentsCount: 4,
      savesCount: 12,
      sharesCount: 3,
      viewsCount: 142,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      authorId: { _id: 'author_mock_1', firstName: 'Karan', lastName: 'Sharma', branch: 'Computer Science', semester: '5', college: 'CampusX HQ' },
      metadata: { githubLink: 'github.com/karan/opencv-ai', techStack: ['Python', 'OpenCV', 'React', 'MongoDB'], demoLink: 'opencv-attendance.vercel.app' }
    },
    {
      _id: 'mock_2',
      title: 'Poll: Which Backend framework do you prefer for high-load systems?',
      content: 'We are planning a workshops series on scalable web architectures. Which backend system would you want to focus on for heavy concurrency and streaming?',
      type: 'poll',
      mediaUrls: [],
      hashtags: ['backend', 'nodejs', 'scaling', 'poll'],
      qualityScore: 85,
      likesCount: 12,
      commentsCount: 9,
      savesCount: 2,
      sharesCount: 1,
      viewsCount: 98,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      authorId: { _id: 'author_mock_2', firstName: 'Preeti', lastName: 'Nair', branch: 'Information Technology', semester: '7', college: 'CampusX HQ' },
      metadata: {
        pollOptions: [
          { optionText: 'Node.js (Express/Fastify) + Redis', votes: ['u1', 'u2', 'u3', 'u4'] },
          { optionText: 'Go (Goroutines & Channels)', votes: ['u5', 'u6', 'u7', 'u8', 'u9'] },
          { optionText: 'Python (FastAPI / Gunicorn)', votes: ['u10'] },
          { optionText: 'Java (Spring Boot / Virtual Threads)', votes: ['u11', 'u12'] }
        ]
      }
    }
  ];
}

function getMockRecommendations() {
  return {
    students: [
      { studentId: 'rec_s_1', score: 90, reason: 'Similar skills • Same Branch', details: { fullName: 'Amit Mishra', branch: 'Computer Science', semester: '5', username: 'amit_coder' } },
      { studentId: 'rec_s_2', score: 75, reason: 'Similar interests', details: { fullName: 'Neha Patel', branch: 'Information Technology', semester: '5', username: 'neha_codes' } }
    ],
    communities: [
      { communityId: 'ai_research', score: 95, reason: 'Matches your interest in AI/ML', details: { name: 'AI/ML Research Lab', description: 'Discussing state of the art in machine learning.' } }
    ],
    projects: [
      { itemId: 'rec_p_1', score: 88, reason: 'Matches your interest in React', title: 'Task Manager Dashboard', authorName: 'Vikas Rao' }
    ]
  };
}

function getMockOpportunities() {
  return [
    { _id: 'mock_op_1', title: 'Frontend Developer Intern', type: 'internship', opportunityScore: 92, metadata: { company: 'Vercel Inc.', role: 'Frontend Intern', stipend: '$800/mo' } },
    { _id: 'mock_op_2', title: 'Campus Hackathon 2026', type: 'event', opportunityScore: 85, metadata: { venue: 'Campus Auditorium', eventDate: new Date(Date.now() + 5 * 86400 * 1000).toISOString() } }
  ];
}

function getMockCreatorStats() {
  return {
    totalImpressions: 432,
    totalReach: 189,
    averageWatchTime: 12.4,
    engagementRate: 15.6,
    demographics: [
      { branch: 'Computer Science', percentage: 65 },
      { branch: 'Information Technology', percentage: 25 },
      { branch: 'Electronics', percentage: 10 }
    ]
  };
}
