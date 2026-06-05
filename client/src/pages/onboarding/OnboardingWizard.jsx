import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { guardianApi } from '../../api/guardianApi';
import toast from 'react-hot-toast';
import WelcomeStep from './steps/WelcomeStep';
import CollegeStep from './steps/CollegeStep';
import BranchStep from './steps/BranchStep';
import PersonalStep from './steps/PersonalStep';
import YearSemesterStep from './steps/YearSemesterStep';
import InterestStep from './steps/InterestStep';
import SkillStep from './steps/SkillStep';
import CompletionStep from './steps/CompletionStep';

const TOTAL_STEPS = 8;
const STEP_LABELS = ['Welcome', 'College', 'Branch', 'Personal', 'Year', 'Interests', 'Skills', 'Complete'];

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [formData, setFormData] = useState({
    college: '', branch: '', semester: '', username: '', bio: '', avatarUrl: '',
    interests: [], skills: [], careerGoals: [],
  });

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const { data } = await guardianApi.getOnboardingStatus();
      const status = data.data;
      if (status.completed) {
        navigate('/dashboard/profile');
        return;
      }
      setCurrentStep(status.currentStep || 1);
      const dbUsername = status.profileData?.username || '';
      let prefilledUsername = dbUsername;
      if (!prefilledUsername && user) {
        prefilledUsername = `${user.firstName || ''}_${user.lastName || ''}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (prefilledUsername.length < 3 && user.email) {
          prefilledUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }
      }
      if (prefilledUsername) {
        prefilledUsername = prefilledUsername.substring(0, 30);
        while (prefilledUsername.length < 3) {
          prefilledUsername += '_';
        }
      }

      setFormData((prev) => ({
        ...prev,
        college: status.userData?.college || '',
        branch: status.userData?.branch || '',
        semester: status.userData?.semester || '',
        username: prefilledUsername,
        bio: status.profileData?.bio || '',
        interests: status.profileData?.interests || [],
        skills: status.profileData?.skills || [],
        careerGoals: status.profileData?.careerGoals || [],
      }));
    } catch (err) {
      console.error('Failed to load onboarding status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async (stepData = {}) => {
    setIsSaving(true);
    try {
      const merged = { ...formData, ...stepData };
      setFormData(merged);

      // Prepare payload based on the current step only to prevent empty field validation errors
      const payload = {};
      if (currentStep === 2) {
        payload.college = merged.college;
      } else if (currentStep === 3) {
        payload.branch = merged.branch;
      } else if (currentStep === 4) {
        payload.username = merged.username;
        payload.bio = merged.bio;
        payload.avatarUrl = merged.avatarUrl;
      } else if (currentStep === 5) {
        payload.semester = merged.semester;
      } else if (currentStep === 6) {
        payload.interests = merged.interests;
      } else if (currentStep === 7) {
        payload.skills = merged.skills;
        payload.careerGoals = merged.careerGoals;
      }

      // Add client-side validation before API call
      if (currentStep === 4) {
        if (!payload.username || payload.username.trim() === '') {
          toast.error('Username cannot be empty');
          setIsSaving(false);
          return;
        }
        // Ensure legacy admin accounts with username='admin' pass onboarding
        if (payload.username !== 'admin') {
          if (payload.username.length < 3 || payload.username.length > 30) {
            toast.error('Username must be between 3 and 30 characters');
            setIsSaving(false);
            return;
          }
          if (!/^[a-z0-9_]+$/.test(payload.username)) {
            toast.error('Username can only contain lowercase letters, numbers, and underscores');
            setIsSaving(false);
            return;
          }
        }
      }

      const { data } = await guardianApi.saveOnboardingStep(currentStep, payload);

      if (data.data.aiSuggestions) {
        setAiSuggestions(data.data.aiSuggestions);
      }

      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save step');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const { data } = await guardianApi.completeOnboarding();
      toast.success('Profile setup complete! Welcome to CampusX! 🎉');
      await refreshProfile();
      navigate('/dashboard/profile');
    } catch (err) {
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="onboarding-layout">
        <div className="loader-container" style={{ minHeight: '100vh' }}>
          <div className="loader"></div>
          <p className="loader-text">Preparing your profile...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const stepProps = {
    formData, setFormData, onNext: handleNext, onBack: handleBack,
    isSaving, aiSuggestions, user,
  };

  return (
    <div className="onboarding-layout">
      {/* Progress Bar */}
      <div className="onboarding-progress-container">
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="onboarding-step-indicators">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className={`onboarding-step-dot ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 === currentStep ? 'current' : ''}`}>
              <span className="onboarding-step-number">{i + 1 < currentStep ? '✓' : i + 1}</span>
              <span className="onboarding-step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        {currentStep === 1 && <WelcomeStep {...stepProps} />}
        {currentStep === 2 && <CollegeStep {...stepProps} />}
        {currentStep === 3 && <BranchStep {...stepProps} />}
        {currentStep === 4 && <PersonalStep {...stepProps} />}
        {currentStep === 5 && <YearSemesterStep {...stepProps} />}
        {currentStep === 6 && <InterestStep {...stepProps} />}
        {currentStep === 7 && <SkillStep {...stepProps} />}
        {currentStep === 8 && <CompletionStep {...stepProps} onComplete={handleComplete} />}
      </div>
    </div>
  );
}
