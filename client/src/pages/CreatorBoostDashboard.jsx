import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function CreatorBoostDashboard() {
  const { user } = useAuth();
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({ totalImpressions: 0, totalReach: 0, averageWatchTime: 0, engagementRate: 0, demographics: [] });
  const [selectedProject, setSelectedProject] = useState(null);

  // AI Assistant States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [assistType, setAssistType] = useState('refine');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form States
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projDemo, setProjDemo] = useState('');
  const [projStack, setProjStack] = useState('');

  // Status States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track page view timing
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    loadDashboardData();

    // Log engagement duration on unmount
    return () => {
      const sessionDurationMs = Date.now() - startTimeRef.current;
      guardianApi.logPulseSession(sessionDurationMs).catch(() => {});
    };
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projRes, statsRes] = await Promise.all([
        guardianApi.listProjects(),
        guardianApi.getCreatorDashboardStats()
      ]);
      setProjects(projRes.data?.data?.projects || projRes.data?.data || []);
      setAnalytics(statsRes.data?.data || { totalImpressions: 412, totalReach: 180, averageWatchTime: 14.5, engagementRate: 18.2, demographics: [] });
    } catch (err) {
      console.error(err);
      setError('Offline Mode. Displaying offline projects and cached stats.');
      loadMockFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockFallback = () => {
    setProjects([
      {
        _id: 'p1',
        title: 'OpenCV Attendance Tracker',
        description: 'Auto marks student attendance in classrooms using MTCNN and FaceNet. Integrated with express and mongodb.',
        githubLink: 'github.com/campus/attendance',
        demoLink: 'attendance.campusx.io',
        techStack: ['Python', 'OpenCV', 'Express', 'MongoDB'],
        likesCount: 24,
        viewsCount: 148,
        authorId: { firstName: 'Dev', lastName: 'Joshi', branch: 'CSE' }
      },
      {
        _id: 'p2',
        title: 'Campus Food Delivery App',
        description: 'A mobile application allowing hostel students to order food from the campus canteen with live queue status.',
        githubLink: 'github.com/campus/food',
        demoLink: 'food.campusx.io',
        techStack: ['Flutter', 'Node.js', 'Socket.IO'],
        likesCount: 18,
        viewsCount: 92,
        authorId: { firstName: 'Maya', lastName: 'Sen', branch: 'ECE' }
      }
    ]);
    setAnalytics({
      totalImpressions: 540,
      totalReach: 210,
      averageWatchTime: 18.4,
      engagementRate: 24.5,
      demographics: [
        { branch: 'Computer Science', percentage: 70 },
        { branch: 'Information Technology', percentage: 20 },
        { branch: 'Electronics', percentage: 10 }
      ]
    });
  };

  // Track project engagement view counts
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    try {
      await guardianApi.trackEngagement({
        projectId: project._id,
        action: 'view',
        durationMs: 3000
      });
      // Increment local views count to reflect interaction
      setProjects(prev => prev.map(p => p._id === project._id ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p));
    } catch {
      // Ignore
    }
  };

  const handlePublishProject = async (e) => {
    e.preventDefault();
    if (!projTitle || !projDesc) return;

    try {
      const res = await guardianApi.publishProject({
        title: projTitle,
        description: projDesc,
        githubLink: projGithub,
        demoLink: projDemo,
        techStack: projStack.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success(res.data?.message || 'Project published to showcase!');
      setProjTitle('');
      setProjDesc('');
      setProjGithub('');
      setProjDemo('');
      setProjStack('');
      setShowPublishModal(false);
      loadDashboardData();
    } catch {
      toast.error('Failed to publish project.');
    }
  };

  // AI Content Assistant
  const handleAnalyzeDraft = async (e) => {
    e.preventDefault();
    if (!draftContent) return;

    setIsAiLoading(true);
    try {
      const res = await guardianApi.getWritingSuggestions(draftTitle, draftContent, assistType);
      setAiSuggestions(res.data?.data?.suggestions || res.data?.data || 'Review: Safe, professional, and well-structured.');
    } catch {
      setAiSuggestions(`✨ AI Suggestion Fallback:
1. Ensure your technology stack tags are explicitly defined.
2. Structure your description using clear sections: Problem Statement, Solution, and Architecture.
3. Recommended tags: #react #innovation #developer-portfolio`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="dashboard-content">
        {/* Creator analytics banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: 'var(--space-xl)' }}>
          <div className="card text-center" style={{ padding: '12px' }}>
            <span className="text-xs text-muted">Total Project Views</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary-light)' }}>{analytics.totalImpressions}</h3>
          </div>
          <div className="card text-center" style={{ padding: '12px' }}>
            <span className="text-xs text-muted">Unique Student Reach</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-accent)' }}>{analytics.totalReach}</h3>
          </div>
          <div className="card text-center" style={{ padding: '12px' }}>
            <span className="text-xs text-muted">Average Read Time</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-success)' }}>{analytics.averageWatchTime}s</h3>
          </div>
          <div className="card text-center" style={{ padding: '12px' }}>
            <span className="text-xs text-muted">Engagement Rate</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-warning)' }}>{analytics.engagementRate}%</h3>
          </div>
        </div>

        {/* Inner layout (Left: project lists, Right: demographic distributions) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 className="card-title">Student Project Showcase</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsAssistantOpen(true)}>
                  ✨ AI Helper
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowPublishModal(true)}>
                  + Post Project
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)' }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="loader-container" style={{ padding: '40px' }}>
                <div className="loader"></div>
                <p className="loader-text">Loading showcase gallery...</p>
              </div>
            ) : (
              <div className="projects-gallery">
                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <div key={proj._id} className="card project-card" style={{ cursor: 'pointer' }} onClick={() => handleProjectSelect(proj)}>
                      <div className="project-thumbnail">💻</div>
                      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{proj.title}</h3>
                        <p className="text-xs text-muted" style={{ margin: '4px 0 12px 0', lineHeight: 1.4, flex: 1 }}>
                          {proj.description?.length > 100 ? `${proj.description.slice(0, 100)}...` : proj.description}
                        </p>
                        
                        <div className="chip-grid" style={{ marginBottom: '12px' }}>
                          {proj.techStack?.map((stack) => (
                            <span key={stack} className="chip chip-active" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{stack}</span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                          <span className="text-xs text-muted">By: @{proj.authorId?.firstName?.toLowerCase()}</span>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            <span>👁️ {proj.viewsCount || 0}</span>
                            <span>❤️ {proj.likesCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card text-center" style={{ gridColumn: '1 / -1', padding: 'var(--space-2xl)', width: '100%' }}>
                    <p className="text-muted text-sm">No projects showcased yet. Click "Post Project" to share yours!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Audience demographics */}
          <div>
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>Audience Demographics</h3>
              <p className="text-xs text-muted" style={{ marginBottom: '12px' }}>Student viewership distribution categorized by branches.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.demographics?.map((demo) => (
                  <div key={demo.branch}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                      <span>{demo.branch}</span>
                      <span>{demo.percentage}%</span>
                    </div>
                    <div className="compatibility-bar-bg">
                      <div style={{ width: `${demo.percentage}%`, height: '100%', background: 'var(--gradient-primary)' }}></div>
                    </div>
                  </div>
                ))}
                {!analytics.demographics?.length && (
                  <p className="text-xs text-muted text-center">Metrics loading on scroll logs...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide-out Writing Assistant Drawer ── */}
      <div className={`content-assistant-sidebar ${isAssistantOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>✨ AI Writing Assistant</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsAssistantOpen(false)}>✕</button>
        </div>

        <form onSubmit={handleAnalyzeDraft} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input className="form-input" placeholder="Title draft..." value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description Draft</label>
            <textarea className="form-input" rows="6" placeholder="Paste your readme, features list or project ideas..." value={draftContent} onChange={e => setDraftContent(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">AI Strategy</label>
            <select className="form-select" value={assistType} onChange={e => setAssistType(e.target.value)}>
              <option value="refine">Refine Tone & Structure</option>
              <option value="hashtags">Generate Hashtag Suggestions</option>
              <option value="summary">Generate Key Feature Bulletpoints</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm btn-full" disabled={isAiLoading}>
            {isAiLoading ? 'Analyzing...' : 'Generate AI Feedback'}
          </button>

          {aiSuggestions && (
            <div className="ai-suggestion-box">
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: 'var(--color-primary-light)' }}>AI Analysis Results:</h4>
              <p style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{aiSuggestions}</p>
            </div>
          )}
        </form>
      </div>

      {/* ── Modals Overlay ── */}

      {/* 1. Post Project Modal */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content card" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title">💻 Showcase New Project</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPublishModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePublishProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input className="form-input" placeholder="e.g. OpenCV Attendance Tracker" value={projTitle} onChange={e => setProjTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Technology Stacks (comma separated)</label>
                <input className="form-input" placeholder="e.g. React, Node.js, WebSockets" value={projStack} onChange={e => setProjStack(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub Repository Link</label>
                <input className="form-input" placeholder="github.com/username/project" value={projGithub} onChange={e => setProjGithub(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Live Deployment Link</label>
                <input className="form-input" placeholder="project.vercel.app" value={projDemo} onChange={e => setProjDemo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea className="form-input" rows="4" placeholder="Features, system design, lessons learned..." value={projDesc} onChange={e => setProjDesc(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-sm btn-full">Publish Project</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Project Details Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title">{selectedProject.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProject(null)}>✕</button>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{selectedProject.description}</p>
              
              <div className="chip-grid">
                {selectedProject.techStack?.map(s => <span key={s} className="chip chip-active">{s}</span>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                {selectedProject.githubLink && (
                  <a href={`https://${selectedProject.githubLink}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm text-center">
                    💻 GitHub Repo
                  </a>
                )}
                {selectedProject.demoLink && (
                  <a href={`https://${selectedProject.demoLink}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm text-center">
                    🔗 Live Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
