import React from 'react';
import { ArrowRight, Plus, Search, ShieldCheck, GraduationCap, Briefcase } from 'lucide-react';
import { ItemCard } from './ItemCard';
import { ItemImage } from './ItemImage';
import type { ItemRecord, UserRecord } from '../utils/campusLogic';
import type { OverviewStatsResponse } from '../services/api';

interface LandingViewProps {
  items: ItemRecord[];
  overview: OverviewStatsResponse | null;
  user: Omit<UserRecord, 'password_hash'> | null;
  onReportLost: () => void;
  onReportFound: () => void;
  onExplore: () => void;
  onSelectItem: (itemId: number) => void;
  onQuickDemoLogin: (email: string, pass: string) => void;
  onOpenStudentLogin: () => void;
  onOpenAdminLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  items,
  overview,
  user,
  onReportLost,
  onReportFound,
  onExplore,
  onSelectItem,
  onQuickDemoLogin,
  onOpenStudentLogin,
  onOpenAdminLogin,
}) => {
  const recentItems = items.slice(0, 6);
  const featuredItem = items.find((i) => Boolean(i.image_path)) || items[0];

  const totalReported = overview?.campusStats.totalReports ?? items.length;
  const totalRecovered =
    (overview?.campusStats.totalReturned ?? 1) +
    (overview?.campusStats.totalMatched ?? 1);
  const activeOpen =
    overview?.campusStats.activeOpen ??
    items.filter((i) => i.status === 'Open').length;
  const activeClaims = overview?.campusStats.activeClaims ?? 2;

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-14">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column: Proposition & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="text-xs font-semibold text-cyan-700 tracking-wide">
                Sir Padampat Singhania University (SPSU), Udaipur · Campus Recovery Portal
              </div>

              <h1
                className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                Lost Something on SPSU Campus? Let&apos;s Find It.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Replace fragmented hostel WhatsApp groups and physical notice boards across SPSU Udaipur with one structured, searchable university registry. Report misplaced belongings, log found items at the Central Library or Proctor Desk, and verify ownership securely.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onReportLost}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Lost Item</span>
                </button>

                <button
                  type="button"
                  onClick={onReportFound}
                  className="px-5 py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Found Item</span>
                </button>

                <button
                  type="button"
                  onClick={onExplore}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Explore Items</span>
                </button>
              </div>

              {/* Dedicated Student Login & Admin Login Portal Access */}
              {!user && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onOpenStudentLogin}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-900 inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <GraduationCap className="w-4 h-4 text-cyan-700" />
                      <span>Student Login Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenAdminLogin}
                      className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-semibold text-amber-900 inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Admin Login Portal</span>
                    </button>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">
                      Or use Instant 1-Click SPSU Demo Sign-In:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onQuickDemoLogin('student@spsu.ac.in', 'Student@123')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/40 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Demo Student (22CSE1048)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickDemoLogin('staff@spsu.ac.in', 'Staff@123')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/40 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                        <span>Demo Library Staff</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickDemoLogin('admin@spsu.ac.in', 'Admin@123')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/40 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Demo Proctor Admin</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Featured Live Campus Report Showcase */}
            <div className="lg:col-span-5 flex flex-col">
              {featuredItem && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between h-full">
                  <div className="relative">
                    <ItemImage
                      src={featuredItem.image_path}
                      alt={featuredItem.title}
                      category={featuredItem.category}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-rose-700">
                        {featuredItem.item_type} Highlight
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{featuredItem.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{featuredItem.report_date}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {featuredItem.title}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {featuredItem.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[220px]">
                        {featuredItem.location}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectItem(featuredItem.item_id)}
                        className="font-semibold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-Width 4-Column Live Database Statistics Strip */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Total Reported Belongings
              </span>
              <span className="text-3xl font-bold text-slate-900 font-mono-tabular mt-1 block">
                {totalReported}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Lost &amp; Found entries in MySQL store
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Recovered &amp; Matched Items
              </span>
              <span className="text-3xl font-bold text-emerald-700 font-mono-tabular mt-1 block">
                {totalRecovered}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Verified via ownership questions
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Active Open Reports
              </span>
              <span className="text-3xl font-bold text-cyan-800 font-mono-tabular mt-1 block">
                {activeOpen}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Currently awaiting match or pickup
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Pending Claim Verifications
              </span>
              <span className="text-3xl font-bold text-slate-900 font-mono-tabular mt-1 block">
                {activeClaims}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Protected by role-based review
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Reported Items Section */}
      <section className="max-w-[1280px] mx-auto px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Recently Reported Campus Items
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Live database feed of lost and found belongings reported by students and faculty.
            </p>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Explore Full Registry ({items.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item) => (
            <ItemCard key={item.item_id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-[1280px] mx-auto px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              How the Campus Recovery Protocol Works
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Designed to prevent false claims while protecting student and staff contact privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                01. Log a Lost or Found Report
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit a structured report with category, building location, date, photograph, and a custom ownership verification question. Personal email addresses and phone numbers are automatically masked.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                02. Search &amp; Submit Ownership Claim
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter the registry by keyword, building, category, or date. To claim a found item, answer the verification prompt and describe unique identifying marks (such as serial numbers or contents).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                03. Authorized Verification &amp; Handover
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Only the report author or a Campus Security Administrator can review and approve claims. Every status transition (Open, Matched, Returned, Closed) is recorded in the StatusHistory audit log.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
