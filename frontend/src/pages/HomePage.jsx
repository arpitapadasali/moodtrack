import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkApiHealth } from '../services/api';
import {
  Heart,
  TrendingUp,
  Calendar,
  Sparkles,
  Shield,
  Download,
  Bell,
  CheckCircle,
  ArrowRight,
  Activity,
  Smile,
  Moon,
  CloudSun
} from 'lucide-react';

/**
 * HomePage Component
 * Professional landing page introducing MoodTrack's features, privacy model, and value proposition
 */
export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestBackend = async () => {
    setLoading(true);
    try {
      const data = await checkApiHealth();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({
        success: false,
        message: err.message || 'Error connecting to backend API'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="text-center pt-6 sm:pt-10 max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mindful Wellbeing &bull; Private by Design</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Track Your Mood. <br />
          <span className="text-brand-600">Understand Your Patterns.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          MoodTrack is a personal daily emotional logging and wellbeing analytics platform.
          Reflect each day in seconds, uncover connections with your sleep habits, and gain clear visibility into your emotional journey.
        </p>

        {/* Hero CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              <span>Go to Your Dashboard ({user?.name || 'User'})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition shadow-2xs"
              >
                <span>Sign In to Account</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-center space-x-6 text-xs text-slate-500 pt-2">
          <span className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>No ads or data selling</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted cloud storage</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export anytime</span>
          </span>
        </div>
      </section>

      {/* 2. Feature Cards Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Everything you need for emotional clarity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A focused tool built to encourage daily reflection without clutter or overwhelm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Effortless Daily Check-ins</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Record your daily mood score (1–5), select emotion tags that describe your state, log hours of sleep, and write private reflections in under 60 seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Trends & Comparative Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Visualize your emotional trajectory over 7, 30, and 90 days with interactive charts. Compare your last 5 days with previous periods to detect shifts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sleep & Lifestyle Correlations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Discover statistical relationships between your hours of rest and daily outlook. Understand what habits cultivate calm and resilience.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Privacy & Ownership Highlights */}
      <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Full Data Sovereignty</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Your personal reflections belong strictly to you.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Emotional logs are intensely personal. MoodTrack is engineered so that you have total control over your data:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No third-party trackers or ads:</strong> Your reflections are never shared with advertising networks.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instant CSV & JSON Export:</strong> Download all your records anytime for offline analysis or personal archiving.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Complete Account Deletion:</strong> Permanently wipe your user profile and all logs with one click whenever you wish.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Observational Wellbeing Disclaimer</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              MoodTrack is an observational tool for mindful habit reflection. It is <strong>not</strong> designed to diagnose, treat, or replace professional psychiatric or medical care.
            </p>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <Link to="/privacy" className="text-brand-600 hover:text-brand-700 font-semibold">
                Read our Privacy Policy &rarr;
              </Link>
              <Link to="/terms" className="text-slate-500 hover:text-slate-700 font-medium">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Connectivity Verification Box (Discreet & Collapsible for development) */}
      <section className="bg-slate-100/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              API Connectivity Status
            </h3>
            <p className="text-[11px] text-slate-500">
              Verify communication between this client and the backend server.
            </p>
          </div>
          <button
            onClick={handleTestBackend}
            disabled={loading}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {loading ? 'Testing...' : 'Check API Status'}
          </button>
        </div>

        {healthStatus && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono ${
              healthStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>Status: {healthStatus.success ? 'Online & Healthy' : 'Offline / Error'}</span>
            <span className="ml-3 text-[11px] text-slate-500">
              {healthStatus.timestamp || new Date().toISOString()}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
