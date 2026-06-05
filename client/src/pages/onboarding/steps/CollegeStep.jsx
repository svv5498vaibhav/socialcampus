import { useState } from 'react';

const COLLEGES = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'NIT Calicut',
  'BITS Pilani', 'BITS Goa', 'BITS Hyderabad',
  'Delhi University', 'VIT Vellore', 'SRM University', 'Anna University',
  'Amity University', 'Manipal Institute of Technology', 'IIIT Hyderabad',
  'Jadavpur University', 'Thapar Institute', 'PSG College of Technology',
  'COEP Pune', 'BIT Mesra', 'DTU Delhi', 'NSUT Delhi', 'IIIT Delhi',
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
