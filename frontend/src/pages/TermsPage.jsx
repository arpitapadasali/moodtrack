import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, Scale, ArrowLeft } from 'lucide-react';

/**
 * Terms of Use Page
 * Explains terms of service, acceptable use, liability limitations, and account guidelines
 */
export default function TermsPage() {
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
          <Scale className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms of Use
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: October 2026 &bull; Please read carefully before using MoodTrack
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3>1. Acceptance of Terms</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            By accessing or registering an account on MoodTrack, you agree to comply with and be bound by these Terms of Use. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3>2. Purpose & Medical Disclaimer</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            MoodTrack is an informational software tool designed to help individuals record personal reflections and observe daily mood trends.
          </p>
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-2">
            <p className="font-bold">Important Notice:</p>
            <p>
              MoodTrack is NOT a medical device, therapeutic service, or clinical diagnosis provider. The service is not designed for crisis intervention, psychiatric emergency management, or professional medical treatment. Always consult licensed medical professionals for health diagnoses or treatment plans.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <h3>3. Account Security & User Responsibilities</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            When using MoodTrack, you agree to:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
            <li>Provide accurate account information during registration.</li>
            <li>Maintain the confidentiality of your login credentials and password.</li>
            <li>Not use the application for any unlawful, harassing, or abusive purpose.</li>
            <li>Not attempt to disrupt, reverse-engineer, overload, or bypass security rate-limiting mechanisms.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <h3>4. Service Availability & Limitation of Liability</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            MoodTrack is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we strive to maintain uninterrupted uptime and robust data security:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
            <li>We do not warrant that service will be error-free, completely uninterrupted, or invulnerable to all unforeseen external disruptions.</li>
            <li>Users are encouraged to utilize the built-in Data Export features to maintain personal backups of their reflections.</li>
            <li>To the maximum extent permitted by applicable law, MoodTrack and its creators shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">5. Termination & Account Cancellation</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            You may discontinue use of MoodTrack and delete your account at any time via the Settings page. We reserve the right to suspend or terminate accounts that violate system integrity, engage in abusive automated scraping, or breach these Terms.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">6. Changes to Terms</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may update these terms from time to time. Significant changes will be reflected with an updated date at the top of this document. Continued use of MoodTrack following modifications constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
