import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await guardianApi.forgotPassword({ email });
      setSent(true);
      toast.success('If an account exists, a reset OTP has been sent.');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔐</span>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your email to receive a reset code</p>
          </div>

          {sent ? (
            <div className="alert alert-success">
              <span>✅</span>
              <span>Check your email for the reset OTP code.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="forgot-password-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading} id="forgot-submit">
                {isLoading ? <><span className="spinner"></span> Sending...</> : 'Send Reset Code'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
