export default function CompletionStep({ formData, onComplete, onBack, isSaving, user }) {
  const summaryItems = [
    { icon: '🏫', label: 'College', value: formData.college || user?.college },
    { icon: '📚', label: 'Branch', value: formData.branch || user?.branch },
    { icon: '📅', label: 'Semester', value: formData.semester || user?.semester },
    { icon: '👤', label: 'Username', value: formData.username ? `@${formData.username}` : '—' },
    { icon: '💡', label: 'Interests', value: `${(formData.interests || []).length} selected` },
    { icon: '🛠️', label: 'Skills', value: `${(formData.skills || []).length} selected` },
    { icon: '🎯', label: 'Career Goals', value: (formData.careerGoals || []).join(', ') || '—' },
  ];

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">🎉</div>
      <h2 className="onboarding-step-title">You're All Set!</h2>
      <p className="onboarding-step-desc">Here's a summary of your profile. Click complete to let our AI generate your recommendations.</p>

      <div className="completion-summary">
        {summaryItems.map((item) => (
          <div key={item.label} className="completion-row">
            <span className="completion-icon">{item.icon}</span>
            <span className="completion-label">{item.label}</span>
            <span className="completion-value">{item.value}</span>
          </div>
        ))}
      </div>

      {(formData.skills || []).length > 0 && (
        <div className="chip-section" style={{ marginTop: 'var(--space-lg)' }}>
          <h3 className="chip-section-title" style={{ fontSize: '0.8125rem' }}>Your Skills</h3>
          <div className="chip-grid">
            {formData.skills.slice(0, 10).map((skill) => (
              <span key={skill} className="chip chip-active" style={{ cursor: 'default', pointerEvents: 'none' }}>{skill}</span>
            ))}
            {formData.skills.length > 10 && (
              <span className="chip" style={{ cursor: 'default' }}>+{formData.skills.length - 10} more</span>
            )}
          </div>
        </div>
      )}

      <div className="onboarding-actions" style={{ marginTop: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onComplete} disabled={isSaving} id="complete-onboarding-btn">
          {isSaving ? <><span className="spinner"></span> Completing...</> : '✨ Complete Setup'}
        </button>
      </div>
    </div>
  );
}
