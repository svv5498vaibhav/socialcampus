import { useState, useEffect } from 'react';
import { guardianApi } from '../api/guardianApi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function SafeVoiceDashboard() {
  // Feed & Metrics states
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sentiment, setSentiment] = useState({ positive: 65, neutral: 25, negative: 10 });
  const [healthIndex, setHealthIndex] = useState(94);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter/Sort states
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('latest');

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('suggestion');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const [selectedPostForReport, setSelectedPostForReport] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [activeCategory, sortOrder]);

  const loadFeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        category: activeCategory !== 'All' ? activeCategory : undefined,
        sort: sortOrder
      };
      const feedRes = await guardianApi.getAnonymousFeed(params);
      setPosts(feedRes.data?.data?.posts || feedRes.data?.data || []);

      // Load supporting analytics/metadata
      try {
        const [catsRes, sentRes, healthRes] = await Promise.all([
          guardianApi.getAnonymousCategories(),
          guardianApi.getAnonymousSentiment(),
          guardianApi.getCommunityHealth()
        ]);
        setCategories(catsRes.data?.data || ['suggestion', 'complaint', 'issue', 'inquiry']);
        setSentiment(sentRes.data?.data || { positive: 60, neutral: 30, negative: 10 });
        setHealthIndex(healthRes.data?.data?.healthIndex || 95);
      } catch {
        // Fallback metadata defaults are fine
        setCategories(['suggestion', 'complaint', 'issue', 'inquiry']);
      }
    } catch (err) {
      console.error(err);
      setError('Offline Mode. Could not sync with SafeVoice secure database.');
      loadMockFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockFallback = () => {
    setPosts([
      {
        _id: 'anon_1',
        content: 'The campus library has a massive bottleneck during exam weeks. We need more study rooms or extended hours up to 2:00 AM.',
        type: 'suggestion',
        studentHash: 'cf83a21',
        sentiment: 'positive',
        moderationStatus: 'approved',
        reportCount: 0,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        _id: 'anon_2',
        content: 'Lab equipment in the electrical machine laboratory is outdated. Three test rigs failed to power up today during the practical examinations.',
        type: 'complaint',
        studentHash: 'ae51b88',
        sentiment: 'negative',
        moderationStatus: 'approved',
        reportCount: 0,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      },
      {
        _id: 'anon_3',
        content: 'Can someone clarify the marking rubric for the Capstone Project reports? The grading criteria seems highly subjective and varies heavily between evaluators.',
        type: 'inquiry',
        studentHash: 'da93f02',
        sentiment: 'neutral',
        moderationStatus: 'pending',
        reportCount: 1,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ]);
    setCategories(['All', 'suggestion', 'complaint', 'issue', 'inquiry']);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const res = await guardianApi.createAnonymousPost(newPostContent, newPostType);
      toast.success(res.data?.message || 'Anonymous feedback submitted. Running AI Safety filters...');
      setNewPostContent('');
      setShowCreateModal(false);
      loadFeed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please check content guidelines.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleReportPost = async (e) => {
    e.preventDefault();
    if (!selectedPostForReport) return;

    setIsSubmittingReport(true);
    try {
      await guardianApi.reportAnonymousPost(selectedPostForReport._id, reportReason, reportDetails);
      toast.success('Thank you for keeping CampusX safe. Report submitted for audit.');
      setReportDetails('');
      setSelectedPostForReport(null);
      loadFeed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      {/* Security Privacy Alert HUD */}
      <div className="dashboard-content">
        <div style={{
          background: 'rgba(10, 14, 39, 0.6)',
          border: '1px dashed var(--color-primary-light)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Secure Cryptographic Anonymity</h3>
            <p className="text-xs text-muted">SafeVoice uses irreversible SHA-256 hashes derived from your credentials. No admin or professor can trace anonymous submissions back to your account.</p>
          </div>
        </div>

        {/* Outer Dashboard Grid (Feed on left, Moderation Analytics on right) */}
        <div className="feed-grid-layout">
          
          {/* Left / Center: Create trigger and Feed */}
          <div style={{ gridColumn: 'span 2' }}>
            
            {/* Create Post Box trigger */}
            <div className="card post-create-trigger" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--space-md)', cursor: 'pointer', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🤫
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '99px', padding: '10px 18px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Submit secure suggestion, complaint, or feedback to the college management anonymously...
              </div>
            </div>

            {/* Filter and Categories panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
              <div className="chip-grid">
                <span className={`chip ${activeCategory === 'All' ? 'chip-active' : ''}`} onClick={() => setActiveCategory('All')}>All Categories</span>
                {categories.map((c) => (
                  <span key={c} className={`chip ${activeCategory === c ? 'chip-active' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => setActiveCategory(c)}>
                    {c}
                  </span>
                ))}
              </div>
              <div>
                <select className="form-select" style={{ padding: '6px 32px 6px 12px', fontSize: '0.8rem', width: 'auto' }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="alert alert-warning">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Timeline of Anon Feed */}
            {isLoading ? (
              <div className="loader-container" style={{ padding: '40px' }}>
                <div className="loader"></div>
                <p className="loader-text">Loading anonymized submissions...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post._id} className="card anonymous-post-card">
                      <div className="anonymous-post-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="anonymous-hash">Hash: #{post.studentHash?.slice(0, 7) || 'system'}</span>
                          <span className={`badge ${post.type === 'complaint' ? 'badge-danger' : post.type === 'suggestion' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.625rem' }}>
                            {post.type}
                          </span>
                        </div>
                        <span className="text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <p style={{ fontSize: '0.925rem', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>{post.content}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-md)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {post.moderationStatus === 'approved' && (
                            <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>🛡️ Approved & Verified</span>
                          )}
                          {post.moderationStatus === 'pending' && (
                            <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>⏳ Under AI Safety Scan</span>
                          )}
                          {post.moderationStatus === 'escalated' && (
                            <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>⚠️ Escalated to Management</span>
                          )}
                          
                          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {post.sentiment === 'positive' ? '😊 Positive' : post.sentiment === 'negative' ? '😡 Negative' : '😐 Neutral'}
                          </span>
                        </div>
                        
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setSelectedPostForReport(post)}>
                          ⚠️ Report Abuse
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card text-center" style={{ padding: '40px' }}>
                    <p className="text-muted">No anonymous reports found in this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: SafeVoice Analytics Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            {/* Community Safety health score */}
            <div className="card text-center">
              <h3 className="card-title" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>Community Health Index</h3>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: healthIndex >= 90 ? 'var(--color-success)' : 'var(--color-warning)', textShadow: '0 0 15px rgba(67, 233, 123, 0.1)' }}>
                {healthIndex}%
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '8px' }}>Based on toxic content detection rates, automated spam filter flags, and report resolution latency.</p>
            </div>

            {/* Sentiment Meter */}
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>Campus Sentiment Index</h3>
              
              <div className="safevoice-sentiment-bar">
                <div className="sentiment-positive" style={{ width: `${sentiment.positive}%` }}></div>
                <div className="sentiment-neutral" style={{ width: `${sentiment.neutral}%` }}></div>
                <div className="sentiment-negative" style={{ width: `${sentiment.negative}%` }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--color-success)' }}>😊 Positive Feedback</span>
                  <span className="font-bold">{sentiment.positive}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>😐 Neutral Inquiry</span>
                  <span className="font-bold">{sentiment.neutral}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--color-error)' }}>😡 Constructive Complaints</span>
                  <span className="font-bold">{sentiment.negative}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals Overlay ── */}

      {/* 1. Create feedback modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content card" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title">🤫 Submit Anonymous Feedback</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'var(--space-md)' }}>
              
              <div className="form-group">
                <label className="form-label">Feedback Type</label>
                <select className="form-select" value={newPostType} onChange={(e) => setNewPostType(e.target.value)}>
                  <option value="suggestion">💡 Suggestion (Ideas, improvements)</option>
                  <option value="complaint">投诉 Complaint (Grievances, classroom issues)</option>
                  <option value="inquiry">❓ Inquiry (Questions for management)</option>
                  <option value="hostel">🏫 Hostel / Infrastructure</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Feedback Details</label>
                <textarea 
                  className="form-input" 
                  rows="5" 
                  placeholder="Provide precise details of the suggestion/complaint. Avoid listing names of individual students or professors to comply with community safety policies."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  maxLength={500}
                ></textarea>
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {newPostContent.length}/500 chars
                </div>
              </div>

              <div className="form-checkbox">
                <input type="checkbox" id="moderation-checkbox" required />
                <label htmlFor="moderation-checkbox" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  I understand this post is scanned by AI content moderation. Bullying or toxic logs are blocked.
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingPost}>
                  {isSubmittingPost ? <span className="spinner"></span> : 'Secure Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Report Feedback post modal */}
      {selectedPostForReport && (
        <div className="modal-overlay" onClick={() => setSelectedPostForReport(null)}>
          <div className="modal-content card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title">⚠️ Report Secure Feedback</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPostForReport(null)}>✕</button>
            </div>
            <form onSubmit={handleReportPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'var(--space-md)' }}>
              
              <div className="form-group">
                <label className="form-label">Violation Category</label>
                <select className="form-select" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="spam">Spam / Duplicate Posts</option>
                  <option value="harassment">Harassment / Bullying / Naming names</option>
                  <option value="hate_speech">Hate Speech / Inappropriate language</option>
                  <option value="doxxing">Attempts to trace or Dox student records</option>
                  <option value="other">Other / Structural Abuse</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Describe Details</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  placeholder="Provide supporting context why this post violates safety regulations."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedPostForReport(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={isSubmittingReport}>
                  {isSubmittingReport ? <span className="spinner"></span> : 'Submit Security Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
