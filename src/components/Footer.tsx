import React from 'react';
import type { ActivePage } from './Navbar';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-100">
          <div className="md:col-span-5 space-y-2">
            <span className="text-base font-bold text-slate-900 font-display block">
              SPSU CampusTrace · Smart Campus Lost &amp; Found System
            </span>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Official centralized item recovery platform for Sir Padampat Singhania University (SPSU), Bhatewar, Udaipur — serving School of Engineering, School of Management, Central Library, and Hostel residences.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2 text-xs">
            <span className="font-semibold text-slate-900 block">Platform Navigation</span>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Explore Lost &amp; Found Registry
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('report-lost')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Report a Lost Belonging
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('report-found')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Report a Found Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Student &amp; Staff Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block">
              SPSU Security &amp; Collection Desks
            </span>
            <p>SPSU Central Library Helpdesk · Academic Block</p>
            <p>Proctor &amp; Chief Security Office · Main Gate Block, Bhatewar, Udaipur (Raj.) 313601</p>
            <p className="font-mono-tabular text-slate-500">
              Collection Hours: Mon–Sat 09:00–18:00 · spsu.ac.in
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sir Padampat Singhania University (SPSU), Udaipur. School of Engineering (CSE).</p>
          <p className="font-mono-tabular">Privacy-Protected SPSU Registry</p>
        </div>
      </div>
    </footer>
  );
};
