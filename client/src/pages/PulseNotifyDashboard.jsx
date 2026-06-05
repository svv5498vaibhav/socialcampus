import { useState, useEffect } from 'react';
import { guardianApi } from '../api/guardianApi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function PulseNotifyDashboard() {
  const [activeTab, setActiveTab] = useState('notifications');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Notifications State
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({ emailAlerts: true, socketAlerts: true, digestFrequency: 'instant' });

  // 2. Growth Analytics State
  const [growthData, setGrowthData] = useState({ growthScore: 68, activeHours: 4.5, checklist: [], clicksCount: 142 });

  // 3. Career Dashboard State
  const [internships, setInternships] = useState([]);
  const [insights, setInsights] = useState('High demand for React developers with OpenCV training in your branch.');

  // 4. Activity Logs State
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'notifications') {
        const [notifRes, prefRes] = await Promise.all([
          guardianApi.getPulseNotifications(),
          guardianApi.getPulsePreferences()
        ]);
        setNotifications(notifRes.data?.data || []);
        setPreferences(prefRes.data?.data || { emailAlerts: true, socketAlerts: true, digestFrequency: 'instant' });
      } else if (activeTab === 'growth') {
        const res = await guardianApi.getPulseDashboard();
        setGrowthData(res.data?.data || { growthScore: 74, activeHours: 6.2, clicksCount: 184, checklist: [
          { item: 'Update Profile Bio', completed: true, points: 50 },
          { item: 'Publish Project Showcase', completed: false, points: 150 },
          { item: 'Attend Community Webinar', completed: false, points: 100 }
        ]});
      } else if (activeTab === 'career') {
        const [intRes, insRes] = await Promise.all([
          guardianApi.getInternshipOpportunities(),
          guardianApi.triggerCareerInsights()
        ]);
        setInternships(intRes.data?.data || []);
        setInsights(insRes.data?.data?.insight || 'High compatibility identified for Frontend Developer Intern roles.');
      } else if (activeTab === 'timeline') {
        const res = await guardianApi.getPulseTimeline();
        setTimeline(res.data?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Offline Mode. Rendering cached dashboards and alerts.');
      loadMockFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockFallback = () => {
    if (activeTab === 'notifications') {
      setNotifications([
        { _id: 'n1', title: 'Badge Unlocked', message: 'You earned the OpenCV Wizard badge!', read: false, type: 'badge', createdAt: new Date().toISOString() },
        { _id: 'n2', title: 'New Comment', message: 'A student commented on your facial detection project.', read: true, type: 'comment', createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() }
      ]);
    } else if (activeTab === 'growth') {
      setGrowthData({
        growthScore: 82,
        activeHours: 5.8,
        clicksCount: 215,
        checklist: [
          { item: 'Complete email OTP verification', completed: true, points: 100 },
          { item: 'Publish first portfolio project', completed: true, points: 150 },
          { item: 'Schedule 1 peer-mentorship meeting', completed: false, points: 200 }
        ]
      });
    } else if (activeTab === 'career') {
      setInternships([
        { _id: 'rec1', title: 'React Developer Intern', company: 'TechSolutions Corp', opportunityScore: 94, status: 'recommended' },
        { _id: 'rec2', title: 'Computer Vision Intern', company: 'RoboSystems Inc', opportunityScore: 88, status: 'recommended' }
      ]);
    } else if (activeTab === 'timeline') {
      setTimeline([
        { _id: 't1', action: 'project_publish', details: { title: 'OpenCV Attendance' }, timestamp: new Date(Date.now() - 3600 * 1000).toISOString() },
        { _id: 't2', action: 'auth_login', details: { ip: '127.0.0.1' }, timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
      ]);
    }
  };

  // 1. Notification Actions
  const handleMarkRead = async (id) => {
    try {
      await guardianApi.markPulseNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      toast.success('Notification marked as read.');
    } catch {
      // simulated update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await guardianApi.markAllPulseNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked read.');
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleUpdatePreferences = async (updatedPrefs) => {
    const next = { ...preferences, ...updatedPrefs };
    setPreferences(next);
    try {
      await guardianApi.updatePulsePreferences(next);
      toast.success('Alert preferences saved.');
    } catch {
      // Ignore
    }
  };

  // 3. Career Actions
  const handleUpdateCareerStatus = async (recId, status) => {
    try {
      await guardianApi.updateOpportunityStatus(recId, status);
      setInternships(prev => prev.map(i => i._id === recId ? { ...i, status } : i));
      toast.success('Opportunity status updated!');
    } catch {
      // Simulated change
      setInternships(prev => prev.map(i => i._id === recId ? { ...i, status } : i));
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="dashboard-content">
        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('notifications')}>
            🔔 Notification Hub
          </button>
          <button className={`btn ${activeTab === 'growth' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('growth')}>
            📈 Growth Metrics
          </button>
          <button className={`btn ${activeTab === 'career' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('career')}>
            🗺️ Career Center
          </button>
          <button className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('timeline')}>
            📋 Activity Logs
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)' }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loader-container" style={{ padding: '40px' }}>
            <div className="loader"></div>
            <p className="loader-text">Syncing engagement streams...</p>
          </div>
        ) : (
          <>
            {/* 1. Alerts & Notifications */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="card">
                  <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h2 className="card-title">Recent Alerts</h2>
                    {notifications.some(n => !n.read) && (
                      <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={`notification-item ${!notif.read ? 'notification-unread' : ''}`}
                          onClick={() => !notif.read && handleMarkRead(notif._id)}
                          style={{ cursor: !notif.read ? 'pointer' : 'default' }}
                        >
                          <div style={{ fontSize: '1.5rem' }}>
                            {notif.type === 'badge' ? '🏆' : notif.type === 'comment' ? '💬' : notif.type === 'security' ? '⚠️' : '🔔'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{notif.title}</h4>
                            <p className="text-xs text-muted" style={{ marginTop: '2px' }}>{notif.message}</p>
                            <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted text-center" style={{ padding: '20px' }}>No alerts logged in your timeline.</p>
                    )}
                  </div>
                </div>

                {/* Preference sidepanel */}
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Alert Settings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-checkbox">
                      <input 
                        type="checkbox" 
                        id="email-alerts" 
                        checked={preferences.emailAlerts}
                        onChange={e => handleUpdatePreferences({ emailAlerts: e.target.checked })} 
                      />
                      <label htmlFor="email-alerts" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        Email digest notifications
                      </label>
                    </div>

                    <div className="form-checkbox">
                      <input 
                        type="checkbox" 
                        id="socket-alerts" 
                        checked={preferences.socketAlerts}
                        onChange={e => handleUpdatePreferences({ socketAlerts: e.target.checked })} 
                      />
                      <label htmlFor="socket-alerts" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        Real-time Socket triggers
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Digest frequency</label>
                      <select 
                        className="form-select"
                        value={preferences.digestFrequency}
                        onChange={e => handleUpdatePreferences({ digestFrequency: e.target.value })}
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        <option value="instant">Instant Alerts</option>
                        <option value="daily">Daily Summaries</option>
                        <option value="weekly">Weekly Summaries</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Growth metrics dashboards */}
            {activeTab === 'growth' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>Pulse Growth Score</h3>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-primary-light)' }}>
                    {growthData.growthScore}
                  </div>
                  <p className="text-xs text-muted" style={{ marginTop: '12px' }}>Your active score aggregates project reviews, forum posts, and complete security checklists.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div>
                      <span className="text-xs text-muted">Weekly Active</span>
                      <h4 style={{ fontWeight: 800 }}>{growthData.activeHours} Hrs</h4>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Interactions</span>
                      <h4 style={{ fontWeight: 800 }}>{growthData.clicksCount}</h4>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Growth Milestones</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {growthData.checklist?.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px', 
                          background: 'rgba(255,255,255,0.02)', 
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                          {item.completed ? '✅' : '⬜'} {item.item}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>+{item.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Career Dashboard */}
            {activeTab === 'career' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>AI Career Insight</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                    {insights}
                  </p>
                </div>

                <div>
                  <h2 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Matching Internship Opportunities</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {internships.map((op) => (
                      <div key={op._id} className="mentor-card" style={{ justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{op.title}</h3>
                          <p className="text-xs text-muted">{op.company} • 🎯 {op.opportunityScore}% Match</p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {op.status === 'recommended' ? (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateCareerStatus(op._id, 'saved')}>
                                Save
                              </button>
                              <button className="btn btn-primary btn-sm" onClick={() => handleUpdateCareerStatus(op._id, 'applied')}>
                                Apply
                              </button>
                            </>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              Status: {op.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Activity Logs & Timeline */}
            {activeTab === 'timeline' && (
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Historical Actions Timeline</h2>
                
                <div className="pulse-timeline">
                  {timeline.length > 0 ? (
                    timeline.map((item) => (
                      <div key={item._id} className="pulse-timeline-item">
                        <div className="pulse-timeline-icon">📝</div>
                        <div className="pulse-timeline-content">
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'capitalize' }}>
                            {item.action?.replace(/_/g, ' ')}
                          </h4>
                          {item.details && (
                            <pre style={{ fontSize: '0.7rem', margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {JSON.stringify(item.details)}
                            </pre>
                          )}
                          <span className="text-xs text-muted" style={{ display: 'block', marginTop: '6px' }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center" style={{ padding: '20px' }}>No session logs saved.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
