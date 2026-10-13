import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Root Layout wrapper for top navigation, dynamic page content, and footer
 */
export default function RootLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-brand-600 hover:text-brand-700 transition">
            <span className="text-2xl">🌱</span>
            <span>MoodTrack</span>
          </Link>
          
          <div className="flex items-center space-x-3 text-sm">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="font-medium text-slate-700 hover:text-brand-600 transition text-sm"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full bg-slate-100 object-cover"
                  />
                  <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-slate-500 hover:text-rose-600 transition ml-1"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} MoodTrack &mdash; Mood Tracking and Analytics Platform</p>
          <div className="flex items-center space-x-4">
            <Link to="/privacy" className="hover:text-brand-600 transition">
              Privacy Policy
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link to="/terms" className="hover:text-brand-600 transition">
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
