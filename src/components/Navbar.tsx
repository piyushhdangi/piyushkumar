import React from 'react';
import type { UserRecord } from '../utils/campusLogic';

export type ActivePage =
  | 'landing'
  | 'explore'
  | 'dashboard'
  | 'report-lost'
  | 'report-found'
  | 'my-reports'
  | 'admin';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  user: Omit<UserRecord, 'password_hash'> | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  user,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-cyan-700 transition-colors whitespace-nowrap shrink-0 font-display text-left cursor-pointer"
        >
          SPSU CampusTrace
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav aria-label="Main Navigation" className="flex items-center gap-5 md:gap-7 text-sm font-medium text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'landing'
                ? 'text-slate-900 border-cyan-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'explore'
                ? 'text-slate-900 border-cyan-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Explore Items
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'dashboard' || activePage === 'report-lost' || activePage === 'report-found'
                ? 'text-slate-900 border-cyan-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Student Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'my-reports'
                ? 'text-slate-900 border-cyan-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            My Reports
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'admin'
                ? 'text-slate-900 border-cyan-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Admin Console
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200/90 rounded-lg hover:bg-slate-200/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.name} ({user.role})
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
