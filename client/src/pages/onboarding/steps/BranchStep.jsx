const BRANCHES = [
  { name: 'Computer Science', icon: '💻' },
  { name: 'Information Technology', icon: '🖥️' },
  { name: 'Electronics and Communication', icon: '📡' },
  { name: 'Electrical Engineering', icon: '⚡' },
  { name: 'Electrical and Electronics', icon: '🔌' },
  { name: 'Mechanical Engineering', icon: '⚙️' },
  { name: 'Civil Engineering', icon: '🏗️' },
  { name: 'Chemical Engineering', icon: '🧪' },
  { name: 'Biotechnology', icon: '🧬' },
  { name: 'Aerospace Engineering', icon: '✈️' },
  { name: 'Mathematics and Computing', icon: '📐' },
  { name: 'Economics', icon: '📈' },
  { name: 'Physics', icon: '⚛️' },
  { name: 'Chemistry', icon: '🔬' },
];

export default function BranchStep({ formData, setFormData, onNext, onBack, isSaving }) {
  const selected = formData.branch;

  const handleSelect = (branch) => {
    setFormData((prev) => ({ ...prev, branch }));
  };

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">📚</div>
      <h2 className="onboarding-step-title">Select Your Branch</h2>
      <p className="onboarding-step-desc">This helps us personalize your skill and career recommendations</p>

      <div className="branch-grid">
        {BRANCHES.map((branch) => (
          <button
            key={branch.name}
            className={`branch-card ${selected === branch.name ? 'branch-active' : ''}`}
            onClick={() => handleSelect(branch.name)}
            id={`branch-${branch.name.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <span className="branch-icon">{branch.icon}</span>
            <span className="branch-name">{branch.name}</span>
          </button>
        ))}
      </div>

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onNext({ branch: selected })}
          disabled={!selected || isSaving}
          id="branch-next-btn"
        >
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
