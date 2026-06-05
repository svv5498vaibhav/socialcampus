export default function YearSemesterStep({ formData, setFormData, onNext, onBack, isSaving }) {
  const selected = formData.semester;

  const semesters = [
    { value: '1', year: '1st Year', sem: 'Semester 1', tier: '🌱 Foundation' },
    { value: '2', year: '1st Year', sem: 'Semester 2', tier: '🌱 Foundation' },
    { value: '3', year: '2nd Year', sem: 'Semester 3', tier: '📘 Core' },
    { value: '4', year: '2nd Year', sem: 'Semester 4', tier: '📘 Core' },
    { value: '5', year: '3rd Year', sem: 'Semester 5', tier: '🚀 Advanced' },
    { value: '6', year: '3rd Year', sem: 'Semester 6', tier: '🚀 Advanced' },
    { value: '7', year: '4th Year', sem: 'Semester 7', tier: '⭐ Specialization' },
    { value: '8', year: '4th Year', sem: 'Semester 8', tier: '⭐ Specialization' },
  ];

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">📅</div>
      <h2 className="onboarding-step-title">Your Academic Year</h2>
      <p className="onboarding-step-desc">This helps our AI recommend semester-appropriate skills</p>

      <div className="semester-grid">
        {semesters.map((sem) => (
          <button
            key={sem.value}
            className={`semester-card ${selected === sem.value ? 'semester-active' : ''}`}
            onClick={() => setFormData((prev) => ({ ...prev, semester: sem.value }))}
            id={`semester-${sem.value}`}
          >
            <span className="semester-tier">{sem.tier}</span>
            <span className="semester-year">{sem.year}</span>
            <span className="semester-num">{sem.sem}</span>
          </button>
        ))}
      </div>

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onNext({ semester: selected })}
          disabled={!selected || isSaving}
          id="semester-next-btn"
        >
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
