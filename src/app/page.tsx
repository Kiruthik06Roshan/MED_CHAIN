import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Shield, Cpu, ClipboardCheck, Lock, Activity, Users } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Shield, title: 'Blockchain-Secured Consent', desc: 'Every access is signed and verified on-chain. Revoke permissions anytime.' },
    { icon: Lock, title: 'Zero Data Leakage', desc: 'Row-level security ensures only authorized parties see your health data.' },
    { icon: Cpu, title: 'AI Safety Insights', desc: 'Real-time medication interaction warnings and fraud detection powered by LLMs.' },
    { icon: ClipboardCheck, title: 'Immutable Audit Trail', desc: 'Every access event is logged with cryptographic proof and timestamp.' },
    { icon: Activity, title: 'Real-time Monitoring', desc: 'Track who accessed your records, when, and for what purpose.' },
    { icon: Users, title: 'Multi-Stakeholder', desc: 'Patients, hospitals, pharmacies, and insurers on one secure platform.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-xl text-primary">MedChain</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={ROUTES.AUTH.LOGIN}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href={ROUTES.AUTH.SIGNUP}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Blockchain-Secured Healthcare
        </div>
        <h1 className="text-5xl font-extrabold text-foreground mb-6 leading-tight">
          Your Health Data.<br />
          <span className="text-primary">Your Control.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          MedChain gives patients cryptographic control over their medical records.
          Hospitals, pharmacies, and insurers only access what you explicitly authorize — and every access is logged forever.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href={ROUTES.AUTH.SIGNUP}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
            Create Free Account
          </Link>
          <Link href={ROUTES.AUTH.LOGIN}
            className="border border-border px-8 py-3 rounded-xl font-semibold text-lg text-foreground hover:bg-secondary transition-colors">
            Sign In
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need for secure health data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-muted-foreground mb-8">Join MedChain today. Free for patients.</p>
          <Link href={ROUTES.AUTH.SIGNUP}
            className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MedChain. Built on Ethereum Sepolia.
      </footer>
    </div>
  );
}
