import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });

  const handleChange = (e) => {
    clearError();
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(form);
      toast.success('Welcome back to CampusX!');
      const userData = result.data.user;
      if (!userData?.onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard/profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🛡️</span>
            <h1 className="auth-title">CampusX</h1>
            <p className="auth-subtitle">Sign in to your campus network</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="form-input-icon">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@college.ac.in"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm" style={{ color: 'var(--color-primary)' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? <span className="spinner"></span> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
