"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = ["Instagram Handle", "Vibe Analysis", "Plan Approval", "Secure Access"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const vibeResult = {
    aesthetic: "Minimal Dark",
    audience: "Tech-savvy creators, 22-35",
    contentStyle: "Educational + Behind-the-scenes",
    growthPotential: 87,
    recommendations: [
      "Post Reels 3x/week for maximum reach",
      "Engage with #buildinpublic community",
      "Collaborate with accounts in the 5K-50K range",
      "Optimize bio for conversion (add CTA)",
    ],
  };

  const automationTargets = [
    { action: "Follow", count: 45, description: "High-affinity accounts in your niche" },
    { action: "Like", count: 120, description: "Recent posts from target audience" },
    { action: "Story Views", count: 200, description: "Active accounts in your cluster" },
    { action: "Comments", count: 15, description: "Genuine engagement on top posts" },
  ];

  const handleNext = () => {
    if (step === 0) {
      if (!handle || handle.length < 2) {
        setHandleError("Please enter a valid Instagram handle");
        return;
      }
      setHandleError("");
      setAnalyzing(true);
      setTimeout(() => { setAnalyzing(false); setStep(1); }, 2000);
      return;
    }
    if (step === 3) {
      if (password.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
      if (password !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
      setPasswordError("");
      localStorage.setItem("ig_token", "mock_token_" + handle);
      localStorage.setItem("ig_handle", handle);
      router.push("/dashboard");
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <h1 className="text-xl font-bold text-brand-light mb-8">Set up your growth engine</h1>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-12">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2 px-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                i < step ? "bg-success border-success text-white" :
                i === step ? "bg-brand border-brand text-white glow-sm" :
                "border-card-border text-muted"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i <= step ? "text-gray-200" : "text-muted"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 ${i < step ? "bg-success" : "bg-card-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="card-base w-full max-w-xl animate-[fadeIn_0.4s_ease]">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold mb-1">Connect your account</h2>
            <p className="text-muted text-sm mb-6">Enter your Instagram handle so we can analyze your vibe.</p>
            <label className="text-sm text-muted block mb-1">Instagram Handle</label>
            <div className="flex items-center gap-2">
              <span className="text-muted">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
                placeholder="yourusername"
                className="input-field flex-1"
              />
            </div>
            {handleError && <p className="text-danger text-sm mt-2">{handleError}</p>}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold mb-1">Your Vibe Analysis</h2>
            <p className="text-muted text-sm mb-6">Here&apos;s what our AI learned about @{handle}</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                ["🎨 Aesthetic", vibeResult.aesthetic],
                ["👥 Audience", vibeResult.audience],
                ["📸 Content Style", vibeResult.contentStyle],
                ["📈 Growth Potential", `${vibeResult.growthPotential}%`],
              ].map(([label, val]) => (
                <div key={label as string} className="bg-dark p-3 rounded-lg">
                  <p className="text-xs text-muted mb-1">{label}</p>
                  <p className="text-sm font-semibold">{val}</p>
                </div>
              ))}
            </div>
            <div className="bg-dark p-4 rounded-lg">
              <p className="text-xs text-muted mb-2">💡 Recommendations</p>
              <ul className="space-y-2">
                {vibeResult.recommendations.map((r) => (
                  <li key={r} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-success">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-1">Your Automation Plan</h2>
            <p className="text-muted text-sm mb-6">Here&apos;s what our agents will do daily for @{handle}</p>
            <div className="space-y-3">
              {automationTargets.map((t) => (
                <div key={t.action} className="flex items-center justify-between bg-dark p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{t.action}</p>
                    <p className="text-xs text-muted">{t.description}</p>
                  </div>
                  <span className="text-brand font-bold text-lg">{t.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
              <p className="text-success text-sm font-semibold">✓ Estimated daily growth: 40-60 new followers</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold mb-1">Secure Your Account</h2>
            <p className="text-muted text-sm mb-6">Create a password to protect your InstaGrowth dashboard.</p>
            <label className="text-sm text-muted block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="input-field mb-4"
            />
            <label className="text-sm text-muted block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="input-field"
            />
            {passwordError && <p className="text-danger text-sm mt-2">{passwordError}</p>}
            <div className="mt-4 p-3 bg-brand/10 border border-brand/30 rounded-lg">
              <p className="text-brand-light text-xs">🔒 Your password is encrypted and never stored in plain text.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-outline px-6 py-2.5">
              Back
            </button>
          ) : <div />}
          <button
            onClick={handleNext}
            disabled={analyzing}
            className="btn-primary px-6 py-2.5 disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : step === 3 ? "Launch Growth Engine 🚀" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
