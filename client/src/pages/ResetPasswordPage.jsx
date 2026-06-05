import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const [form, setForm] = useState({ email: emailFromState, otp: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await guardianApi.resetPassword({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔑</span>
            <h1 className="auth-title">New Password</h1>
            <p className="auth-subtitle">Enter your OTP and new password</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="reset-password-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <input id="reset-email" name="email" type="email" className="form-input"
                placeholder="you@college.ac.in" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">OTP Code</label>
              <input id="reset-otp" name="otp" type="text" className="form-input"
                placeholder="Enter 6-digit OTP" value={form.otp} onChange={handleChange}
                maxLength={6} inputMode="numeric" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-pw">New Password</label>
              <input id="reset-new-pw" name="newPassword" type="password" className="form-input"
                placeholder="Enter new password" value={form.newPassword} onChange={handleChange}
                autoComplete="new-password" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-pw">Confirm Password</label>
              <input id="reset-confirm-pw" name="confirmPassword" type="password" className="form-input"
                placeholder="Re-enter new password" value={form.confirmPassword} onChange={handleChange}
                autoComplete="new-password" required />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading} id="reset-submit">
              {isLoading ? <><span className="spinner"></span> Resetting...</> : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
