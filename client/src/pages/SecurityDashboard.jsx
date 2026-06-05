import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

function TrustScoreRing({ score, riskLevel }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = { low: '#43e97b', medium: '#fbbf24', high: '#f87171' };
  const strokeColor = colors[riskLevel] || colors.medium;

  return (
    <div className="trust-score-ring">
      <svg viewBox="0 0 120 120">
        <circle className="ring-bg" cx="60" cy="60" r={radius} strokeWidth="8" />
        <circle className="ring-fill" cx="60" cy="60" r={radius} strokeWidth="8"
          stroke={strokeColor} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="trust-score-value">
        <div className="trust-score-number" style={{ color: strokeColor }}>{score}</div>
        <div className="trust-score-label">Trust Score</div>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const config = {
    low: { label: 'Low Risk', className: 'badge-success', emoji: '✅' },
    medium: { label: 'Medium Risk', className: 'badge-warning', emoji: '⚡' },
    high: { label: 'High Risk', className: 'badge-danger', emoji: '🔴' },
  };
  const { label, className, emoji } = config[level] || config.medium;
  return <span className={`badge ${className}`}>{emoji} {label}</span>;
}

export default function SecurityDashboard() {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [security, setSecurity] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [secRes, sessRes, histRes] = await Promise.all([
        guardianApi.getSecurityStatus(),
        guardianApi.getSessions(),
        guardianApi.getLoginHistory(),
      ]);
      setSecurity(secRes.data.data);
      setSessions(sessRes.data.data.sessions);
      setLoginHistory(histRes.data.data.logs);
    } catch (err) {
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await guardianApi.revokeSession(sessionId);
      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    toast.success('Logged out from all devices');
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <div className="loader-container" style={{ minHeight: '100vh' }}>
          <div className="loader"></div>
          <p className="loader-text">Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }

  const risk = security?.risk || {};
  const trustScore = risk.trustScore || 0;
  const riskLevel = risk.riskLevel || 'medium';
  const breakdown = risk.breakdown || {};
  const recommendations = risk.recommendations || [];

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <Navbar />

      <div className="dashboard-content">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
          Security Dashboard
        </h1>

        {/* Trust Score + Risk Overview */}
        <div className="dashboard-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Trust Score</h2>
              <RiskBadge level={riskLevel} />
            </div>
            <TrustScoreRing score={trustScore} riskLevel={riskLevel} />

            {/* Score Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs font-bold" style={{ color: value > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    +{value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Profile</h2>
              <span className={`badge ${user?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {user?.status}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Name', `${user?.firstName} ${user?.lastName}`],
                ['Email', user?.email],
                ['College', user?.college],
                ['Branch', user?.branch],
                ['Semester', user?.semester],
                ['Roll Number', user?.rollNumber || 'Not set'],
                ['Email Verified', user?.emailVerified ? '✅ Verified' : '❌ Not Verified'],
                ['Member Since', new Date(user?.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="text-sm text-muted">{label}</span>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>🎯 Recommendations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recommendations.map((rec, i) => (
                <div key={i} className="alert alert-info" style={{ margin: 0 }}>
                  <span>💡</span>
                  <span>{rec.message} <strong style={{ color: 'var(--color-success)' }}>(+{rec.impact} pts)</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Active Sessions</h2>
              <p className="card-subtitle">{sessions.length} active session(s)</p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleLogoutAll} id="logout-all-btn">
              Logout All
            </button>
          </div>
          {sessions.map((session) => (
            <div className="session-item" key={session._id}>
              <div className="session-info">
                <span className="session-icon">
                  {session.device?.os?.includes('Windows') ? '💻' : session.device?.os?.includes('Mac') ? '🖥️' : session.device?.os?.includes('Android') ? '📱' : '🌐'}
                </span>
                <div className="session-details">
                  <h4>{session.device?.name || 'Unknown Device'}</h4>
                  <p>{session.ipAddress} • {new Date(session.lastAccessedAt).toLocaleString()}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleRevokeSession(session._id)} id={`revoke-${session._id}`}>
                Revoke
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-lg)' }}>No active sessions</p>
          )}
        </div>

        {/* Login History */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>📋 Login History</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((log) => (
                  <tr key={log._id}>
                    <td style={{ textTransform: 'capitalize' }}>{log.action?.replace(/_/g, ' ')}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'badge-success' : log.status === 'failure' ? 'badge-danger' : 'badge-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="text-muted">{log.ipAddress}</td>
                    <td className="text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loginHistory.length === 0 && (
            <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-lg)' }}>No login history</p>
          )}
        </div>
      </div>
    </div>
  );
}
