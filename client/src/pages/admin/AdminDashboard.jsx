import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { guardianApi } from '../../api/guardianApi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    loadData();
  }, [activeTab, userFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview' || !stats) {
        const { data } = await guardianApi.getAdminStats();
        setStats(data.data);
      }
      if (activeTab === 'users') {
        const { data } = await guardianApi.getUsers({ ...userFilter, search: searchQuery, page: pagination.page });
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
      if (activeTab === 'alerts') {
        const { data } = await guardianApi.getFraudAlerts({ page: 1, limit: 50 });
        setAlerts(data.data.logs);
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const { data } = await guardianApi.blockUser(userId);
      toast.success(data.message);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const { data } = await guardianApi.suspendUser(userId);
      toast.success(data.message);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setUserFilter((prev) => ({ ...prev }));
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'alerts', label: '🚨 Alerts' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="dashboard-navbar-brand">
          <span>🛡️</span>
          <span>Guardian Admin</span>
        </div>
        <div className="dashboard-navbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/security')} id="back-to-dashboard">
            ← Dashboard
          </button>
          <span className="text-sm text-muted">{user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="admin-logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
          Admin Panel
        </h1>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button key={tab.id} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ flex: 1 }} onClick={() => setActiveTab(tab.id)} id={`tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="loader-container"><div className="loader"></div><p className="loader-text">Loading...</p></div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <>
                <div className="dashboard-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                  {[
                    { icon: '👥', label: 'Total Users', value: stats.users?.total || 0, gradient: 'var(--gradient-primary)' },
                    { icon: '✅', label: 'Active Users', value: stats.users?.active || 0, gradient: 'var(--gradient-success)' },
                    { icon: '⏳', label: 'Pending', value: stats.users?.pending || 0, gradient: 'var(--gradient-warning)' },
                    { icon: '🚫', label: 'Blocked', value: stats.users?.blocked || 0, gradient: 'var(--gradient-danger)' },
                    { icon: '⚠️', label: 'High Risk', value: stats.security?.highRiskUsers || 0, gradient: 'var(--gradient-secondary)' },
                    { icon: '🚨', label: 'Unresolved Alerts', value: stats.security?.unresolvedAlerts || 0, gradient: 'var(--gradient-danger)' },
                  ].map((stat) => (
                    <div className="dashboard-stat" key={stat.label}>
                      <div className="dashboard-stat-icon" style={{ background: stat.gradient }}>{stat.icon}</div>
                      <div>
                        <div className="dashboard-stat-value">{stat.value}</div>
                        <div className="dashboard-stat-label">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">User Management</h2>
                  <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-input" placeholder="Search users..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '250px', padding: '8px 12px', fontSize: '0.8125rem' }} />
                    <button type="submit" className="btn btn-primary btn-sm" id="search-users-btn">Search</button>
                  </form>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>College</th>
                        <th>Status</th>
                        <th>Risk</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            {u.firstName} {u.lastName}
                          </td>
                          <td>{u.email}</td>
                          <td>{u.college}</td>
                          <td>
                            <span className={`badge ${
                              u.status === 'active' ? 'badge-success' :
                              u.status === 'blocked' ? 'badge-danger' :
                              u.status === 'suspended' ? 'badge-warning' : 'badge-neutral'
                            }`}>{u.status}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              u.riskLevel === 'low' ? 'badge-success' :
                              u.riskLevel === 'medium' ? 'badge-warning' : 'badge-danger'
                            }`}>{u.riskLevel}</span>
                          </td>
                          <td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {u.role !== 'admin' && (
                                <>
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleBlockUser(u._id)}
                                    style={{ color: u.status === 'blocked' ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.75rem' }}
                                    id={`block-${u._id}`}>
                                    {u.status === 'blocked' ? 'Unblock' : 'Block'}
                                  </button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleSuspendUser(u._id)}
                                    style={{ color: u.status === 'suspended' ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.75rem' }}
                                    id={`suspend-${u._id}`}>
                                    {u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-xl)' }}>No users found</p>
                )}

                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: 'var(--space-lg)' }}>
                    {Array.from({ length: pagination.pages }, (_, i) => (
                      <button key={i + 1} className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setPagination((p) => ({ ...p, page: i + 1 })); loadData(); }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Fraud & Security Alerts</h2>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>IP</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert) => (
                        <tr key={alert._id}>
                          <td style={{ textTransform: 'capitalize' }}>{alert.eventType?.replace(/_/g, ' ')}</td>
                          <td>
                            <span className={`badge ${
                              alert.severity === 'critical' ? 'badge-danger' :
                              alert.severity === 'high' ? 'badge-danger' :
                              alert.severity === 'medium' ? 'badge-warning' : 'badge-info'
                            }`}>{alert.severity}</span>
                          </td>
                          <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {alert.description}
                          </td>
                          <td className="text-muted">{alert.ipAddress || '—'}</td>
                          <td>
                            <span className={`badge ${alert.resolved ? 'badge-success' : 'badge-warning'}`}>
                              {alert.resolved ? 'Resolved' : 'Open'}
                            </span>
                          </td>
                          <td className="text-muted">{new Date(alert.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {alerts.length === 0 && (
                  <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-xl)' }}>No alerts — all clear! 🎉</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
