import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

function CompletionRing({ score, level }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const levelColors = { beginner: '#f87171', intermediate: '#fbbf24', advanced: '#60a5fa', campus_pro: '#43e97b' };
  const color = levelColors[level] || '#667eea';

  return (
    <div className="trust-score-ring">
      <svg viewBox="0 0 120 120">
        <circle className="ring-bg" cx="60" cy="60" r={radius} strokeWidth="8" />
        <circle className="ring-fill" cx="60" cy="60" r={radius} strokeWidth="8"
          stroke={color} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="trust-score-value">
        <div className="trust-score-number" style={{ color }}>{score}</div>
        <div className="trust-score-label">{level?.replace('_', ' ')}</div>
      </div>
    </div>
  );
}

export default function ProfileDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [careerPaths, setCareerPaths] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [generatedBios, setGeneratedBios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profRes, compRes, careerRes] = await Promise.all([
        guardianApi.getFullProfile(),
        guardianApi.getProfileCompletion(),
        guardianApi.getCareerRecommendations(),
      ]);
      setProfile(profRes.data.data);
      setCompletion(compRes.data.data);
      setCareerPaths(careerRes.data.data.careerPaths);
    } catch { toast.error('Failed to load profile'); }
    finally { setIsLoading(false); }
  };

  const loadRoadmap = async (goal) => {
    try {
      const { data } = await guardianApi.getCareerRoadmap(goal);
      setRoadmap(data.data);
    } catch { toast.error('Failed to load roadmap'); }
  };

  const handleGenerateBio = async () => {
    try {
      const { data } = await guardianApi.generateBio();
      setGeneratedBios(data.data.bios);
      toast.success('AI bios generated!');
    } catch { toast.error('Failed to generate bio'); }
  };

  const handleSelectBio = async (bio) => {
    try {
      await guardianApi.updateFullProfile({ bio });
      setProfile((prev) => ({ ...prev, bio }));
      setGeneratedBios([]);
      toast.success('Bio updated!');
    } catch { toast.error('Failed to update bio'); }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <div className="loader-container" style={{ minHeight: '100vh' }}>
          <div className="loader"></div><p className="loader-text">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '👤 Overview' },
    { id: 'career', label: '🎯 Career' },
    { id: 'roadmap', label: '🗺️ Roadmap' },
  ];

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="dashboard-content">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>Profile Dashboard</h1>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button key={tab.id} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ flex: 1 }} onClick={() => { setActiveTab(tab.id); if (tab.id === 'roadmap' && !roadmap) loadRoadmap(profile?.careerGoals?.[0] || 'Web Development'); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            {/* Profile Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Profile Completion</h2>
                <span className={`badge ${completion?.level === 'campus_pro' ? 'badge-success' : completion?.level === 'advanced' ? 'badge-info' : completion?.level === 'intermediate' ? 'badge-warning' : 'badge-neutral'}`}>
                  {completion?.level?.replace('_', ' ')}
                </span>
              </div>
              <CompletionRing score={completion?.score || 0} level={completion?.level || 'beginner'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {completion?.checklist?.map((item) => (
                  <div key={item.item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span className="text-sm">{item.completed ? '✅' : '⬜'} {item.item}</span>
                    <span className="text-xs text-muted">+{item.points}pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>About</h2>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {profile?.bio || profile?.generatedBio || 'No bio yet'}
                </p>
                <button className="btn btn-ghost btn-sm mt-sm" onClick={handleGenerateBio} id="generate-bio-btn">
                  ✨ Generate AI Bio
                </button>
              </div>

              {generatedBios.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <p className="text-xs text-muted font-bold">Choose a generated bio:</p>
                  {generatedBios.map((bio, i) => (
                    <div key={i} style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                      onClick={() => handleSelectBio(bio)}>
                      <p className="text-sm">{bio}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="divider"><span>Details</span></div>

              {[
                ['College', profile?.user?.college], ['Branch', profile?.user?.branch],
                ['Semester', profile?.user?.semester], ['Roll Number', profile?.user?.rollNumber || '—'],
                ['Username', profile?.username ? `@${profile.username}` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span className="text-sm text-muted">{label}</span>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}

              {/* Skills */}
              {profile?.skills?.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <h3 className="text-xs text-muted font-bold mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</h3>
                  <div className="chip-grid">
                    {profile.skills.map((s) => <span key={s} className="chip chip-active" style={{ cursor: 'default', pointerEvents: 'none', fontSize: '0.75rem', padding: '4px 10px' }}>{s}</span>)}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profile?.interests?.length > 0 && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <h3 className="text-xs text-muted font-bold mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interests</h3>
                  <div className="chip-grid">
                    {profile.interests.map((i) => <span key={i} className="chip" style={{ cursor: 'default', pointerEvents: 'none', fontSize: '0.75rem', padding: '4px 10px', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>{i}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Career Tab */}
        {activeTab === 'career' && (
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>🎯 Career Path Recommendations</h2>
            <p className="text-sm text-muted mb-lg">Ranked by how well each path matches your skills, interests, and branch.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {careerPaths.slice(0, 8).map((path, idx) => (
                <div key={path.id} className="career-path-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span className="career-path-rank">#{idx + 1}</span>
                    <span style={{ fontSize: '1.5rem' }}>{path.icon}</span>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{path.name}</h3>
                      <p className="text-xs text-muted">{path.description}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: path.matchPercent >= 60 ? 'var(--color-success)' : path.matchPercent >= 30 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                      {path.matchPercent}%
                    </div>
                    <p className="text-xs text-muted">match</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🗺️ Learning Roadmap</h2>
              {profile?.careerGoals?.length > 0 && (
                <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '0.8125rem' }}
                  value={roadmap?.careerGoal || ''} onChange={(e) => loadRoadmap(e.target.value)} id="roadmap-goal-select">
                  {profile.careerGoals.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
            </div>
            {roadmap ? (
              <div className="roadmap-timeline">
                {roadmap.semesters?.map((sem) => (
                  <div key={sem.semester} className="roadmap-semester">
                    <div className="roadmap-semester-header">
                      <span className="roadmap-semester-badge">Semester {sem.semester}</span>
                    </div>
                    <div className="roadmap-topics">
                      {sem.topics?.map((topic) => (
                        <div key={topic.name} className="roadmap-topic">
                          <span className={`roadmap-priority ${topic.priority}`}>{topic.priority === 'high' ? '🔴' : topic.priority === 'medium' ? '🟡' : '🟢'}</span>
                          <span className="roadmap-topic-name">{topic.name}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>{topic.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="loader-container"><div className="loader"></div><p className="loader-text">Generating roadmap...</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
