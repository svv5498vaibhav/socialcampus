export default function WelcomeStep({ onNext, user }) {
  return (
    <div className="onboarding-step animate-fade-in">
      <div className="onboarding-step-icon">🚀</div>
      <h1 className="onboarding-step-title">Welcome to CampusX</h1>
      <p className="onboarding-step-desc">
        Hey <strong style={{ color: 'var(--color-primary-light)' }}>{user?.firstName || 'there'}</strong>! 
        Let's build your professional student profile in just a few steps.
      </p>
      <div className="onboarding-features">
        {[
          { icon: '🎯', title: 'Personalized Recommendations', desc: 'AI-powered skill and career suggestions' },
          { icon: '🗺️', title: 'Learning Roadmap', desc: 'Semester-wise growth path tailored for you' },
          { icon: '🤝', title: 'Campus Networking', desc: 'Connect with students sharing your interests' },
          { icon: '💼', title: 'Career Guidance', desc: 'Discover paths aligned with your goals' },
        ].map((feature) => (
          <div key={feature.title} className="onboarding-feature-card">
            <span className="onboarding-feature-icon">{feature.icon}</span>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-lg btn-full" onClick={() => onNext()} id="onboarding-start-btn">
        Let's Get Started →
      </button>
    </div>
  );
}
