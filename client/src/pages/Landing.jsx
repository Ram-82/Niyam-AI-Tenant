import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Shield, FileDown, CheckCircle, Zap, ArrowRight } from 'lucide-react';

const CHECKS = [
  'GSTIN format & state code validation',
  'HSN/SAC code presence & digit length',
  'Duplicate invoice number detection',
  'CGST+SGST vs IGST conflict check',
  'Future-dated invoice warnings',
  'Tax amount reconciliation',
];

const HOW_IT_WORKS = [
  { icon: Upload, title: 'Upload Documents', desc: 'Drop PDFs, Excel sheets, or CSV files for any client' },
  { icon: Shield, title: 'AI Catches Errors', desc: '12 GST validation rules run automatically on every invoice' },
  { icon: FileDown, title: 'Download Report', desc: 'Get a clean PDF: "Sharma Traders — 4 issues found. Fix before filing."' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface font-heading">
      {/* Nav */}
      <nav className="bg-primary px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Niyam AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Login</Link>
          <Link to="/signup" className="btn-primary text-sm px-4 py-2">Start Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 text-sm text-accent mb-6">
            <Shield size={14} />
            GST Pre-Filing Intelligence for CAs
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Upload.<br />
            <span className="text-accent">Validate.</span><br />
            Report.
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
            Give your clients clean data before filing starts. No more back-and-forth on GST discrepancies.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-8 py-3 text-base">
              Start Free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn bg-white/10 text-white hover:bg-white/20 px-8 py-3 text-base">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-primary mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="card p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon size={24} className="text-accent" />
              </div>
              <div className="text-xs font-bold text-accent mb-2">STEP {i + 1}</div>
              <h3 className="font-bold text-primary mb-2">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we check */}
      <section className="py-16 px-6 bg-primary text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">What We Validate</h2>
          <p className="text-center text-white/60 text-sm mb-10">12 rules run on every invoice. Every file. Every time.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {CHECKS.map(check => (
              <div key={check} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                <CheckCircle size={16} className="text-accent flex-shrink-0" />
                <span className="text-sm">{check}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Built for CAs Managing MSME Clients</h2>
        <p className="text-muted text-base mb-6">
          If you file GST returns for 10–100 small businesses, you know the pain of chasing clients for missing GSTINs, wrong HSN codes, and mismatched amounts. Niyam AI catches all of that before you even open the portal.
        </p>
        <Link to="/signup" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
          Get Started Free
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white/40 text-center text-xs py-6 px-4">
        © {new Date().getFullYear()} Niyam AI · Pre-filing validation tool for Chartered Accountants
      </footer>
    </div>
  );
}
