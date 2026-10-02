import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import { SOCKET_URL } from '../api/apiClient';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import campusxLogo from '../assets/campusx-logo.png';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [points, setPoints] = useState(user?.points || 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const socketRef = useRef(null);

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch initial notifications count and user points
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const notifRes = await guardianApi.getPulseNotifications();
        const unread = notifRes.data.data.filter((n) => !n.read).length;
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

    socketRef.current = io(SOCKET_URL);

    socketRef.current.emit('authenticate', user.id);

    socketRef.current.on('notification', () => {
      setUnreadCount((prev) => prev + 1);
    });

    socketRef.current.on('points-update', (data) => {
      if (data.points !== undefined) {
        setPoints(data.points);
      }
    });

    socketRef.current.on('badge-unlock', (data) => {
      toast.success(`Badge Unlocked: ${data.badgeName || 'New Achievement'}!`);
    });

    socketRef.current.on('achievement-unlock', (data) => {
      toast.success(`Achievement Unlocked: ${data.achievementName || 'Completed'}!`);
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
    { path: '/dashboard/feed', label: 'Feed' },
    { path: '/dashboard/rankforge', label: 'RankForge' },
    { path: '/dashboard/safevoice', label: 'SafeVoice' },
    { path: '/dashboard/branchconnect', label: 'Communities' },
    { path: '/dashboard/creatorboost', label: 'CreatorBoost' },
    { path: '/dashboard/pulsenotify', label: 'Alerts', badge: unreadCount },
    { path: '/dashboard/profile', label: 'Profile' },
    { path: '/dashboard/security', label: 'Security' }
  ];

  return (
    <header className="campusx-navbar">
      {/* Brand logo & title */}
      <div
        className="campusx-nav-brand"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate('/');
          }
        }}
      >
        <img src={campusxLogo} alt="CampusX Logo" className="campusx-nav-logo" />
        <span className="campusx-nav-brand-text">
          CAMPUS<span className="brand-accent">X</span>
        </span>
      </div>

      {/* Center Desktop Navigation Links */}
      <nav className="campusx-nav-center" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`campusx-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="campusx-nav-badge" aria-label={`${item.badge} unread notifications`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Navigation */}
        {user?.role === 'admin' && (
          <button
            type="button"
            className={`campusx-nav-item campusx-nav-admin ${location.pathname === '/admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* Right Side Actions */}
      <div className="campusx-nav-right">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="campusx-theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* User Points Badge */}
        <div className="campusx-points-pill" title={`${points} Campus Points`}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>{points.toLocaleString()} pts</span>
        </div>

        {/* User Profile Info */}
        <div className="campusx-user-section">
          <div
            className="campusx-user-pill"
            onClick={() => navigate('/dashboard/profile')}
            role="button"
            tabIndex={0}
            title="Go to Profile"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/dashboard/profile');
              }
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="User Avatar" className="campusx-user-avatar" />
            ) : (
              <div className="campusx-user-initials">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>
            )}
            <div className="campusx-user-meta">
              <span className="campusx-user-name">{user?.firstName || 'Student'}</span>
              <span className="campusx-user-handle">
                @{user?.firstName?.toLowerCase() || 'user'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            className="campusx-logout-btn"
            onClick={handleLogout}
            title="Log out of CampusX"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="campusx-mobile-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="campusx-mobile-drawer">
          <div className="campusx-mobile-drawer-user">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => {
                navigate('/dashboard/profile');
                setIsMobileMenuOpen(false);
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="campusx-user-avatar" />
              ) : (
                <div className="campusx-user-initials">
                  {user?.firstName?.[0] || 'U'}
                  {user?.lastName?.[0] || ''}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="campusx-user-name" style={{ fontSize: '0.875rem' }}>
                  {user?.firstName || 'Student'} {user?.lastName || ''}
                </span>
                <span className="campusx-user-handle">
                  @{user?.firstName?.toLowerCase() || 'user'}
                </span>
              </div>
            </div>
            <div className="campusx-points-pill">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{points.toLocaleString()} pts</span>
            </div>
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                className={`campusx-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="campusx-mobile-badge">{item.badge}</span>
                )}
              </button>
            );
          })}

          {user?.role === 'admin' && (
            <button
              type="button"
              className={`campusx-mobile-link ${location.pathname === '/admin' ? 'active' : ''}`}
              style={{ color: 'var(--color-warning, #F59E0B)' }}
              onClick={() => {
                navigate('/admin');
                setIsMobileMenuOpen(false);
              }}
            >
              <span>Admin</span>
            </button>
          )}

          <div className="campusx-mobile-drawer-actions">
            <button
              type="button"
              className="campusx-logout-btn"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
