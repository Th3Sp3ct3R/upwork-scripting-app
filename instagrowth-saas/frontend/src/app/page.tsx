import Link from "next/link";

const features = [
  { icon: "🎯", title: "Smart Targeting", desc: "AI identifies your ideal audience based on content analysis, engagement patterns, and niche affinity scoring." },
  { icon: "🧬", title: "Affinity Analysis", desc: "8-layer clustering engine maps your audience DNA — who they are, what they love, and how to reach them." },
  { icon: "🤖", title: "Autonomous Execution", desc: "Our agents work 24/7 — following, engaging, and growing your account while you sleep." },
];

const plans = [
  { name: "Starter", price: "$29", period: "/mo", features: ["1 Instagram account", "500 actions/day", "Basic affinity analysis", "Email support"], cta: "Start Free Trial", popular: false },
  { name: "Pro", price: "$79", period: "/mo", features: ["3 Instagram accounts", "2,000 actions/day", "Full affinity engine", "Priority support", "Custom targeting rules", "Agent duty controls"], cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "$199", period: "/mo", features: ["10 Instagram accounts", "Unlimited actions", "White-glove onboarding", "Dedicated account manager", "API access", "Custom integrations"], cta: "Contact Sales", popular: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="text-center py-24 px-4 max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-semibold mb-6">
          🚀 AI-Powered Growth Engine
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <span className="gradient-text">Grow your Instagram</span>
          <br />on autopilot
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Our AI analyzes your vibe, creates a personalized strategy, and executes it 24/7. Real followers. Real engagement. Zero effort.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/onboarding" className="btn-primary text-lg px-8 py-4">
            Connect Instagram →
          </Link>
          <a href="#features" className="btn-outline text-lg px-8 py-4">
            Learn More
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-3 gap-8 text-center">
          {[["100K+", "Profiles Analyzed"], ["47%", "Avg Growth Rate"], ["24/7", "Autonomous"]].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-extrabold gradient-text">{val}</p>
              <p className="text-muted text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to <span className="gradient-text">grow</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card-base hover:border-brand/50 transition-colors group">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-brand-light transition-colors">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="text-muted text-center mb-12">Start free. Scale when ready.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.name} className={`card-base relative ${p.popular ? "border-brand glow" : ""}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-muted text-sm">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className={`block text-center py-3 rounded-lg font-semibold transition-all ${
                  p.popular ? "bg-brand text-white hover:bg-brand-light" : "border border-card-border text-gray-400 hover:border-brand hover:text-brand"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-8 text-center text-muted text-sm">
        <p>© 2026 InstaGrowth. AI-powered growth, done right.</p>
      </footer>
    </div>
  );
}
