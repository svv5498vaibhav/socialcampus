import { useState } from 'react';

const COLLEGES = [
  'Visvesvaraya National Institute of Technology (VNIT) Nagpur',
  'Indian Institute of Information Technology (IIIT) Nagpur',
  'Laxminarayan Innovation Technological University (LIT), Nagpur',
  'Shri Ramdeobaba College of Engineering and Management (RCOEM) / Ramdeobaba University',
  'Yeshwantrao Chavan College of Engineering (YCCE)',
  'G. H. Raisoni College of Engineering (GHRCE)',
  'St. Vincent Pallotti College of Engineering and Technology',
  'Symbiosis Institute of Technology (SIT), Nagpur',
  'Priyadarshini Bhagwati College of Engineering',
  'KDK College of Engineering',
  'Priyadarshini College of Engineering',
  'S. B. Jain Institute of Technology, Management and Research',
  'Nagpur Institute of Technology (NIT)',
  'J. D. College of Engineering and Management',
  'Suryodaya College of Engineering & Technology',
  'Jhulelal Institute of Technology',
  'Tulsiramji Gaikwad-Patil College of Engineering and Technology',
  'Anjuman College of Engineering and Technology',
  'Wainganga College of Engineering and Management',
  'Govindrao Wanjari College of Engineering and Technology',
];

export default function CollegeStep({ formData, setFormData, onNext, onBack, isSaving }) {
  const [search, setSearch] = useState('');
  const selected = formData.college;

  const filtered = COLLEGES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (college) => {
    setFormData((prev) => ({ ...prev, college }));
  };

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">🏫</div>
      <h2 className="onboarding-step-title">Select Your College</h2>
      <p className="onboarding-step-desc">Choose your institution from the list below</p>

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="college-search"
        />
      </div>

      <div className="chip-grid">
        {filtered.map((college) => (
          <button
            key={college}
            className={`chip ${selected === college ? 'chip-active' : ''}`}
            onClick={() => handleSelect(college)}
            id={`college-${college.replace(/\s+/g, '-').toLowerCase()}`}
          >
            🎓 {college}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted text-sm text-center mt-lg">No colleges found. Try a different search.</p>
      )}

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onNext({ college: selected })}
          disabled={!selected || isSaving}
          id="college-next-btn"
        >
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
