import { useState, useEffect } from 'react';
import { guardianApi } from '../../../api/guardianApi';

const CAREER_GOALS = [
  'Web Development', 'AI / Machine Learning', 'Data Science', 'Cyber Security',
  'App Development', 'Cloud & DevOps', 'UI/UX Design', 'Blockchain',
  'Embedded Systems', 'Robotics', 'Game Development', 'Product Design & CAD',
];

export default function SkillStep({ formData, setFormData, onNext, onBack, isSaving }) {
  const [suggestions, setSuggestions] = useState({ recommended: [], byTier: {}, careerBoosted: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const selectedSkills = formData.skills || [];
  const selectedGoals = formData.careerGoals || [];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data } = await guardianApi.getSkillSuggestions();
      setSuggestions(data.data);
    } catch { /* fallback empty */ }
    finally { setLoadingSuggestions(false); }
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const current = prev.skills || [];
      const exists = current.includes(skill);
      return { ...prev, skills: exists ? current.filter((s) => s !== skill) : [...current, skill] };
    });
  };

  const toggleGoal = (goal) => {
    setFormData((prev) => {
      const current = prev.careerGoals || [];
      const exists = current.includes(goal);
      return { ...prev, careerGoals: exists ? current.filter((g) => g !== goal) : [...current, goal] };
    });
  };

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">🛠️</div>
      <h2 className="onboarding-step-title">Your Skills & Career Goals</h2>
      <p className="onboarding-step-desc">
        Select skills you have and career paths you're exploring.
        <span className="badge badge-info" style={{ marginLeft: '8px' }}>AI Powered</span>
      </p>

      {/* Career Goals */}
      <div className="chip-section">
        <h3 className="chip-section-title">🎯 Career Goals (select 1-3)</h3>
        <div className="chip-grid">
          {CAREER_GOALS.map((goal) => (
            <button
              key={goal}
              className={`chip ${selectedGoals.includes(goal) ? 'chip-active' : ''}`}
              onClick={() => toggleGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommended Skills */}
      {loadingSuggestions ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <>
          {suggestions.recommended?.length > 0 && (
            <div className="chip-section">
              <h3 className="chip-section-title">💡 Recommended Skills for Your Level</h3>
              <div className="chip-grid">
                {suggestions.recommended.map((skill) => (
                  <button
                    key={skill}
                    className={`chip ${selectedSkills.includes(skill) ? 'chip-active' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.careerBoosted?.length > 0 && (
            <div className="chip-section">
              <h3 className="chip-section-title">🚀 Career-Boosted Skills</h3>
              <div className="chip-grid">
                {suggestions.careerBoosted.map((skill) => (
                  <button
                    key={skill}
                    className={`chip ${selectedSkills.includes(skill) ? 'chip-active' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-sm text-muted mt-lg text-center">
        Skills: <strong style={{ color: 'var(--color-primary-light)' }}>{selectedSkills.length}</strong> | 
        Goals: <strong style={{ color: 'var(--color-accent)' }}>{selectedGoals.length}</strong>
      </p>

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onNext({ skills: selectedSkills, careerGoals: selectedGoals })}
          disabled={selectedSkills.length === 0 || isSaving}
          id="skills-next-btn"
        >
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
