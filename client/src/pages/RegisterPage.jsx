import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLLEGES = [
  'IIT Delhi', 'IIT Bombay', 'NIT Trichy', 'NIT Warangal', 'BITS Pilani',
  'Delhi University', 'VIT Vellore', 'SRM University', 'Anna University',
  'Amity University', 'Manipal Institute of Technology', 'IIIT Hyderabad',
  'Jadavpur University', 'Thapar Institute', 'PSG College of Technology',
];

const BRANCHES = {
  'IIT Delhi': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Mathematics and Computing'],
  'IIT Bombay': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Aerospace Engineering', 'Chemical Engineering', 'Civil Engineering'],
  'NIT Trichy': ['Computer Science', 'Electronics and Communication', 'Electrical and Electronics', 'Mechanical Engineering', 'Civil Engineering'],
  'default': ['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
};

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
  const labels = ['weak', 'fair', 'good', 'strong', 'very_strong'];
  const colors = ['var(--color-error)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-success)', 'var(--color-success)'];
  return { level: strength, label: labels[strength] || 'weak', color: colors[strength] || 'var(--color-error)' };
}

export default function RegisterPage() {
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    rollNumber: '', college: '', branch: '', semester: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    clearError();
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!form.password) errors.password = 'Password is required';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) errors.password = 'Need at least one uppercase letter';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) errors.password = 'Need at least one special character';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!form.college) errors.college = 'Select your college';
    if (!form.branch) errors.branch = 'Select your branch';
    if (!form.semester) errors.semester = 'Select your semester';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success('Account created! Check your email for OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const selectedBranches = BRANCHES[form.college] || BRANCHES['default'];
  const pwStrength = getPasswordStrength(form.password);

  return (
    <div className="auth-layout">
      <div className="auth-container" style={{ maxWidth: '540px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🛡️</span>
            <h1 className="auth-title">Join CampusX</h1>
            <p className="auth-subtitle">Create your verified student account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-first-name">First Name</label>
                <input id="reg-first-name" name="firstName" type="text" className={`form-input ${fieldErrors.firstName ? 'error' : ''}`}
                  placeholder="John" value={form.firstName} onChange={handleChange} />
                {fieldErrors.firstName && <p className="form-error">{fieldErrors.firstName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-last-name">Last Name</label>
                <input id="reg-last-name" name="lastName" type="text" className={`form-input ${fieldErrors.lastName ? 'error' : ''}`}
                  placeholder="Doe" value={form.lastName} onChange={handleChange} />
                {fieldErrors.lastName && <p className="form-error">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">College Email</label>
              <input id="reg-email" name="email" type="email" className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                placeholder="you@college.ac.in" value={form.email} onChange={handleChange} />
              {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-roll">Roll Number</label>
              <input id="reg-roll" name="rollNumber" type="text" className="form-input"
                placeholder="e.g., 2024CS001" value={form.rollNumber} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-college">College</label>
              <select id="reg-college" name="college" className={`form-select ${fieldErrors.college ? 'error' : ''}`}
                value={form.college} onChange={handleChange}>
                <option value="">Select your college</option>
                {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.college && <p className="form-error">{fieldErrors.college}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-branch">Branch</label>
                <select id="reg-branch" name="branch" className={`form-select ${fieldErrors.branch ? 'error' : ''}`}
                  value={form.branch} onChange={handleChange}>
                  <option value="">Select branch</option>
                  {selectedBranches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {fieldErrors.branch && <p className="form-error">{fieldErrors.branch}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-semester">Semester</label>
                <select id="reg-semester" name="semester" className={`form-select ${fieldErrors.semester ? 'error' : ''}`}
                  value={form.semester} onChange={handleChange}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.semester && <p className="form-error">{fieldErrors.semester}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" name="password" type="password" className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Min 8 characters, mix of types" value={form.password} onChange={handleChange} autoComplete="new-password" />
              {form.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div className={`password-strength-fill ${pwStrength.label}`}></div>
                  </div>
                  <span className="password-strength-label" style={{ color: pwStrength.color }}>
                    {pwStrength.label.replace('_', ' ')}
                  </span>
                </div>
              )}
              {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm-password">Confirm Password</label>
              <input id="reg-confirm-password" name="confirmPassword" type="password" className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
              {fieldErrors.confirmPassword && <p className="form-error">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading} id="register-submit">
              {isLoading ? <><span className="spinner"></span> Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
