import { useState } from 'react';

export default function PersonalStep({ formData, setFormData, onNext, onBack, isSaving, user }) {
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.username || formData.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (formData.username && !/^[a-z0-9_]+$/.test(formData.username)) errs.username = 'Only lowercase letters, numbers, underscores';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext({ username: formData.username, bio: formData.bio, avatarUrl: formData.avatarUrl });
  };

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">👤</div>
      <h2 className="onboarding-step-title">Personal Details</h2>
      <p className="onboarding-step-desc">Set up your unique identity on CampusX</p>

      <div className="onboarding-form">
        <div className="form-group">
          <label className="form-label" htmlFor="onb-name">Full Name</label>
          <input
            id="onb-name"
            type="text"
            className="form-input"
            value={`${user?.firstName || ''} ${user?.lastName || ''}`}
            disabled
          />
          <p className="text-xs text-muted mt-sm">Set during registration</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="onb-username">Username *</label>
          <input
            id="onb-username"
            name="username"
            type="text"
            className={`form-input ${errors.username ? 'error' : ''}`}
            placeholder="e.g., john_doe_24"
            value={formData.username}
            onChange={handleChange}
          />
          {errors.username && <p className="form-error">{errors.username}</p>}
          <p className="text-xs text-muted mt-sm">campusx.com/@{formData.username || 'username'}</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="onb-bio">Bio (optional)</label>
          <textarea
            id="onb-bio"
            name="bio"
            className="form-input"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
          <p className="text-xs text-muted mt-sm">{formData.bio?.length || 0}/500 — You can also let AI generate one later</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="onb-avatar">Profile Photo URL (optional)</label>
          <input
            id="onb-avatar"
            name="avatarUrl"
            type="text"
            className="form-input"
            placeholder="https://example.com/your-photo.jpg"
            value={formData.avatarUrl}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={handleNext} disabled={isSaving} id="personal-next-btn">
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
