'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type Step = 'profile' | 'preferences' | 'resume' | 'strategy' | 'confirm';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);

  // Profile data
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [bio, setBio] = useState('');
  const [resume, setResume] = useState('');

  // Preferences data
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [autoApply, setAutoApply] = useState(false);
  const [applicationsPerDay, setApplicationsPerDay] = useState(5);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
      e.preventDefault();
    }
  };

  const addRole = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roleInput.trim()) {
      setTargetRoles([...targetRoles, roleInput.trim()]);
      setRoleInput('');
      e.preventDefault();
    }
  };

  const addLocation = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput('');
      e.preventDefault();
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const removeRole = (index: number) => {
    setTargetRoles(targetRoles.filter((_, i) => i !== index));
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (step === 'profile') {
        // Save profile
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills,
            experience: { years: parseInt(experience) || 0 },
            targetRoles,
            locations,
            bio,
            originalResume: resume,
          }),
        });
        setStep('preferences');
      } else if (step === 'preferences') {
        // Save preferences
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRoles,
            locations,
            salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
            salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
            autoApplyEnabled: autoApply,
            applicationsPerDay,
            minJobFitScore: 70,
          }),
        });
        setStep('confirm');
      } else if (step === 'confirm') {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container-main py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12">
      <div className="container-main max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {['Profile', 'Preferences', 'Confirm'].map((label, index) => {
              const steps: Step[] = ['profile', 'preferences', 'confirm'];
              const isActive = steps.indexOf(step) >= index;
              return (
                <div key={label} className="flex-1">
                  <div className={`text-center text-sm font-medium ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                    {label}
                  </div>
                  {index < 2 && (
                    <div className={`h-1 mt-2 ${isActive ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          {step === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Let's start with your profile</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="input-field"
                  placeholder="5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Skills (press Enter to add)</label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  className="input-field"
                  placeholder="e.g., React, Python, Project Management"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill, i) => (
                    <span key={i} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(i)} className="hover:text-primary-900">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Paste your resume</label>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="input-field min-h-[200px]"
                  placeholder="Copy and paste your resume here..."
                />
              </div>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Set your job preferences</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Target Roles (press Enter to add)</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={addRole}
                  className="input-field"
                  placeholder="e.g., Senior React Developer, Product Manager"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {targetRoles.map((role, i) => (
                    <span key={i} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {role}
                      <button onClick={() => removeRole(i)} className="hover:text-primary-900">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Locations (press Enter to add)</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={addLocation}
                  className="input-field"
                  placeholder="e.g., San Francisco, Remote, New York"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {locations.map((loc, i) => (
                    <span key={i} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {loc}
                      <button onClick={() => removeLocation(i)} className="hover:text-primary-900">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Salary ($)</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="input-field"
                    placeholder="60000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Salary ($)</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="input-field"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Applications per day</label>
                <input
                  type="number"
                  value={applicationsPerDay}
                  onChange={(e) => setApplicationsPerDay(parseInt(e.target.value))}
                  className="input-field"
                  min="1"
                  max="50"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Auto-apply to matching jobs</span>
              </label>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">You're all set!</h2>
              <p className="text-gray-600">Your profile has been created successfully. You're ready to start applying to jobs.</p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">Your settings:</h3>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>• Target roles: {targetRoles.join(', ') || 'Not set'}</li>
                  <li>• Locations: {locations.join(', ') || 'Not set'}</li>
                  <li>• Skills: {skills.join(', ') || 'Not set'}</li>
                  <li>• Auto-apply: {autoApply ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            {step !== 'profile' && (
              <button
                onClick={() => {
                  if (step === 'preferences') setStep('profile');
                  else if (step === 'confirm') setStep('preferences');
                }}
                className="btn-outline flex-1"
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              onClick={handleContinue}
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : step === 'confirm' ? 'Go to Dashboard' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
