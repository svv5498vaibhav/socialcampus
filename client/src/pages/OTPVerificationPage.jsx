import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function OTPVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode) => {
    setIsLoading(true);
    setError('');
    try {
      await guardianApi.verifyOTP({ email, otp: otpCode });
      toast.success('Email verified successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await guardianApi.resendOTP({ email });
      toast.success('New OTP sent to your email');
      setResendCooldown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-header">
            <span className="auth-logo">📧</span>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to<br />
              <strong style={{ color: 'var(--color-primary-light)' }}>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${digit ? 'filled' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                id={`otp-input-${index}`}
                disabled={isLoading}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {isLoading && (
            <div className="loader-container" style={{ padding: 'var(--space-md)' }}>
              <div className="loader"></div>
              <p className="loader-text">Verifying...</p>
            </div>
          )}

          <p className="text-muted text-sm mt-lg">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="btn-ghost"
              style={{
                color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                fontWeight: 600, display: 'inline', padding: 0, fontSize: '0.875rem',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', background: 'transparent', border: 'none',
              }}
              id="resend-otp-btn"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </p>

          <div className="auth-footer">
            <Link to="/register">← Back to Registration</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
