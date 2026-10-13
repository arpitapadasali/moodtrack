import React from 'react';
import { Menu, Settings, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeader({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Logo/Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-lg lg:hidden"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 lg:hidden">
          <span className="text-xl">🌱</span>
          <span className="font-bold text-slate-900 text-base">MoodTrack</span>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            Welcome, {user?.name || 'Friend'} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right: Actions, Avatar, Settings & Logout */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Settings Button */}
        <button
          onClick={handleSettingsClick}
          title="Settings"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar & Name */}
        <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
            alt={user?.name}
            className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 object-cover"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Personal Account
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log out of MoodTrack"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
