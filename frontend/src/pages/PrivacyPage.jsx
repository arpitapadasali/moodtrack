import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, EyeOff, Database, Trash2, Sparkles, ArrowLeft } from 'lucide-react';

/**
 * Privacy Policy Page
 * Explains data practices, storage, consent, limitation of AI, and right-to-be-forgotten
 */
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: October 2026 &bull; Effective immediately for all registered users
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Our Core Privacy Commitment</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          At <strong>MoodTrack</strong>, we treat your emotional wellbeing logs, daily feelings, reflections, and sleep metrics with the utmost confidentiality. We do not sell your personal data, we do not show advertisements based on your emotional state, and we do not use third-party tracking scripts to profile your mood.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <h3>1. What Information We Collect</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you create an account and record check-ins on MoodTrack, we store:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
            <li><strong>Account Credentials:</strong> Your name, email address, and a cryptographically hashed version of your password (hashed using bcrypt with 12 salt rounds; your raw password is never stored or viewable).</li>
            <li><strong>Daily Wellbeing Check-ins:</strong> Mood rating score (1–5 scale), hours of sleep recorded, tags representing emotions or activities, and optional written reflections.</li>
            <li><strong>Environmental Context (Optional):</strong> If you choose to attach weather context to a check-in, city/weather parameters (temperature, conditions) are saved with that entry.</li>
            <li><strong>Notification Settings:</strong> Your configured reminder time and timezone for daily journal notifications.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <h3>2. How Your Data Is Stored & Protected</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your data is hosted in a secure MongoDB Atlas cloud database cluster with encrypted connections (TLS/SSL) and protected behind JSON Web Token (JWT) authentication:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
            <li><strong>Strict User Isolation:</strong> Every database query and modification is scoped strictly by your unique user account ID. No user can view, edit, or delete another user's check-ins or reflections.</li>
            <li><strong>Zero Sensitive Data Leaks:</strong> API responses never return password hashes or internal server traces.</li>
            <li><strong>Rate Limiting:</strong> Endpoints are protected with rate-limiters to guard against automated brute-force attacks and abuse.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3>3. Machine Learning & Automated Statistical Insights</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            MoodTrack offers optional pattern detection and statistical insights (e.g., day-of-week trends, sleep-mood correlations):
          </p>
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <p className="font-semibold">Privacy By Design for Analytics:</p>
            <p>
              When numerical trend calculations or the optional machine learning microservice are invoked, <strong>only anonymized numerical values</strong> (mood integers 1–5, sleep durations, and day-of-week indices) are processed. 
              <strong>Your personal written journal reflections, email, name, and account identifiers are NEVER transmitted to external AI APIs.</strong>
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3>4. Important Wellness & Medical Disclaimer</h3>
          </div>
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-2">
            <p className="font-bold">Not a Medical or Clinical Diagnostic Service</p>
            <p className="leading-relaxed">
              MoodTrack is designed solely for self-reflection and personal lifestyle habits tracking. The graphs, pattern correlations, and statistical summaries generated by this application <strong>do not constitute medical advice, psychological counseling, or clinical psychiatric diagnosis</strong>.
            </p>
            <p className="leading-relaxed">
              If you are experiencing severe emotional distress, anxiety, depression, or mental health emergencies, please contact a qualified healthcare practitioner or immediate crisis helpline in your region.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3>5. Data Ownership, Portability & Deletion ("Right to Be Forgotten")</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            You maintain complete ownership and control of your information at all times:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
            <li><strong>Data Portability:</strong> You can download a complete copy of your recorded entries at any time in standard JSON or CSV format directly from your Settings page.</li>
            <li><strong>Irreversible Deletion:</strong> You have the right to permanently delete your account at any time via Settings &gt; Danger Zone. Triggering deletion permanently wipes your user profile, all recorded daily entries, and reminder configurations from the database.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">6. Contact Information</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            For questions regarding this policy, data practices, or account assistance, please contact the MoodTrack administrator at:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
            Support Email: [SUPPORT_EMAIL_PLACEHOLDER: support@moodtrack.app]
          </div>
        </section>
      </div>
    </div>
  );
}
