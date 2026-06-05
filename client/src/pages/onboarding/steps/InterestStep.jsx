import { useState, useEffect } from 'react';
import { guardianApi } from '../../../api/guardianApi';

export default function InterestStep({ formData, setFormData, onNext, onBack, isSaving }) {
  const [suggestions, setSuggestions] = useState({ recommended: [], universal: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const selected = formData.interests || [];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data } = await guardianApi.getInterestSuggestions();
      setSuggestions(data.data);
    } catch {
      // fallback empty
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const current = prev.interests || [];
      const exists = current.includes(interest);
      return {
        ...prev,
        interests: exists ? current.filter((i) => i !== interest) : [...current, interest],
      };
    });
  };

  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">💡</div>
      <h2 className="onboarding-step-title">What Interests You?</h2>
      <p className="onboarding-step-desc">
        Select topics you're passionate about. Our AI recommends these based on your branch.
        <span className="badge badge-info" style={{ marginLeft: '8px' }}>AI Powered</span>
      </p>

      {loadingSuggestions ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <>
          {suggestions.recommended?.length > 0 && (
            <div className="chip-section">
              <h3 className="chip-section-title">🎯 Recommended for You</h3>
              <div className="chip-grid">
                {suggestions.recommended.map((interest) => (
                  <button
                    key={interest}
                    className={`chip ${selected.includes(interest) ? 'chip-active' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.universal?.length > 0 && (
            <div className="chip-section">
              <h3 className="chip-section-title">🌍 General Interests</h3>
              <div className="chip-grid">
                {suggestions.universal.map((interest) => (
                  <button
                    key={interest}
                    className={`chip ${selected.includes(interest) ? 'chip-active' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-sm text-muted mt-lg text-center">
        Selected: <strong style={{ color: 'var(--color-primary-light)' }}>{selected.length}</strong> interests
      </p>

      <div className="onboarding-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onNext({ interests: selected })}
          disabled={selected.length === 0 || isSaving}
          id="interests-next-btn"
        >
          {isSaving ? <><span className="spinner"></span> Saving...</> : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
