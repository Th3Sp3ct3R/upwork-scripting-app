"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold">
          <span className="gradient-text">⚡ InstaGrowth</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <Link href="/onboarding" className="bg-brand px-4 py-2 rounded-lg text-white font-semibold hover:bg-brand-light transition">
            Get Started
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/dashboard" className="text-lg font-bold">
        <span className="gradient-text">⚡ InstaGrowth</span>
      </Link>
      <nav className="hidden md:flex items-center gap-1">
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/accounts", label: "Accounts" },
          { href: "/affinity", label: "Affinity" },
          { href: "/agent-duties", label: "Agent Duties" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-brand/20 text-brand-light font-semibold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand/30 flex items-center justify-center text-sm font-bold text-brand-light">
          G
        </div>
      </div>
    </header>
  );
}
