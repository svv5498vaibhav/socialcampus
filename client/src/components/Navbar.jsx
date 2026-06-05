import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [points, setPoints] = useState(user?.points || 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const socketRef = useRef(null);


  // Fetch initial notifications count and user points
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const notifRes = await guardianApi.getPulseNotifications();
        const unread = notifRes.data.data.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch {
        // Silently fail if not loaded
      }

      try {
        const profileRes = await guardianApi.getProfile();
        if (profileRes.data?.data?.user) {
          setPoints(profileRes.data.data.user.points || 0);
        }
      } catch {
        // Silently fail
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Socket listener for notifications & points
  useEffect(() => {
    if (!user || !user.id) return;

    const socketUrl = window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin;

    socketRef.current = io(socketUrl);

    socketRef.current.emit('authenticate', user.id);

    socketRef.current.on('notification', () => {
      setUnreadCount(prev => prev + 1);
    });

    socketRef.current.on('points-update', (data) => {
      if (data.points !== undefined) {
        setPoints(data.points);
      }
    });

    socketRef.current.on('badge-unlock', (data) => {
      toast.success(`🏆 Badge Unlocked: ${data.badgeName || 'New Achievement'}!`);
    });

    socketRef.current.on('achievement-unlock', (data) => {
      toast.success(`🎉 Achievement Unlocked: ${data.achievementName || 'Completed'}!`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard/feed', label: '🏠 Feed' },
    { path: '/dashboard/rankforge', label: '🏆 RankForge' },
    { path: '/dashboard/safevoice', label: '🔒 SafeVoice' },
    { path: '/dashboard/branchconnect', label: '👥 Communities' },
    { path: '/dashboard/creatorboost', label: '💻 CreatorBoost' },
    { path: '/dashboard/pulsenotify', label: '🔔 Alerts', badge: unreadCount },
    { path: '/dashboard/profile', label: '👤 Profile' },
    { path: '/dashboard/security', label: '🔒 Security' }
  ];

  return (
    <nav className="dashboard-navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* Brand logo */}
      <div className="dashboard-navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <span style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: '1.2rem', textTransform: 'uppercase' }}>CampusX</span>
      </div>

      {/* Desktop navigation */}
      <div className="dashboard-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`btn btn-ghost btn-sm ${isActive ? 'btn-active-navbar' : ''}`}
                style={{
                  color: isActive
                    ? 'var(--color-primary-light)'
                    : 'var(--color-text-primary)',

                  position: 'relative',

                  fontWeight: isActive ? '800' : '600',

                  fontSize: '0.95rem',

                  letterSpacing: '0.3px',

                  padding: '8px 12px'
                }}
                onClick={() => navigate(item.path)}
              >
                {item.label}
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--color-error)',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    borderRadius: '99px',
                    padding: '2px 6px',
                    border: '2px solid var(--color-bg-secondary)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {user?.role === 'admin' && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')} style={{ color: 'var(--color-warning)' }}>
              ⚙️ Admin
            </button>
          )}
        </div>
        <div
          onClick={toggleTheme}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } }}
          className={`theme-switch ${theme}`}
          role="button"
          tabIndex={0}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <div className="theme-slider">
            {theme === "dark" ? "🌙" : "☀️"}
          </div>
        </div>

        {/* User Stats & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>@{user?.firstName?.toLowerCase()}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚡ {points} pts
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer-menu"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            background: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--glass-border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 999
          }}
        >
          {navItems.map(item => (
            <button
              key={item.path}
              className="btn btn-ghost btn-sm"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                color: location.pathname === item.path ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                fontWeight: location.pathname === item.path ? '700' : '500'
              }}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.label}
              {item.badge > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          {user?.role === 'admin' && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-warning)' }}
              onClick={() => {
                navigate('/admin');
                setIsMobileMenuOpen(false);
              }}
            >
              ⚙️ Admin Panel
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleLogout} style={{ width: '100%', marginTop: '8px' }}>
            Logout
          </button>
        </div>
      )}

      {/* Add mobile display rules inline */}
      <style>{`
        @media (max-width: 950px) {
          .desktop-links {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: block !important;
          }
        }
        .btn-active-navbar::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 12px;
          right: 12px;
          height: 2px;
          background: var(--color-primary-light);
          border-radius: 4px;
        }
      `}</style>
    </nav>
  );
}
