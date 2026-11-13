import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  LogIn,
} from 'lucide-react';
import { api, type OverviewStatsResponse } from '../services/api';
import type {
  UserRecord,
  ItemRecord,
  ClaimRecord,
  ClaimStatus,
} from '../utils/campusLogic';

interface UserDashboardViewProps {
  mode: 'dashboard' | 'my-reports';
  user: Omit<UserRecord, 'password_hash'> | null;
  items: ItemRecord[];
  overview: OverviewStatsResponse | null;
  onOpenAuth: () => void;
  onSelectItem: (itemId: number) => void;
  onEditItem: (item: ItemRecord) => void;
  onReportLost: () => void;
  onReportFound: () => void;
  onExplore: () => void;
  onDataMutated: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  mode,
  user,
  items,
  overview,
  onOpenAuth,
  onSelectItem,
  onEditItem,
  onReportLost,
  onReportFound,
  onExplore,
  onDataMutated,
}) => {
  const [submittedClaims, setSubmittedClaims] = useState<ClaimRecord[]>([]);
  const [receivedClaims, setReceivedClaims] = useState<ClaimRecord[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-items' | 'incoming-claims' | 'my-claims'>(
    'my-items'
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadClaimsData = async () => {
    if (!user) return;
    setLoadingClaims(true);
    try {
      const res = await api.getMyClaims();
      setSubmittedClaims(res.submittedClaims);
      setReceivedClaims(res.receivedClaims);
    } catch (err) {
      console.error('Error loading user claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadClaimsData();
    } else {
      setSubmittedClaims([]);
      setReceivedClaims([]);
    }
  }, [user?.user_id, items.length]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-900">
            Sign In to Access Your Campus Workspace
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sign in with your college account or choose one of the pre-configured demo accounts (Student, Staff, or Admin) to manage your reports, track recovery status, and review ownership claims.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Select Demo Account</span>
          </button>
        </div>
      </div>
    );
  }

  const myReportedItems = items.filter((i) => i.user_id === user.user_id);
  const totalLost = overview?.campusStats.totalLost ?? items.filter((i) => i.item_type === 'Lost').length;
  const totalFound = overview?.campusStats.totalFound ?? items.filter((i) => i.item_type === 'Found').length;
  const activeClaimsCount =
    overview?.userStats?.myActiveClaims ??
    submittedClaims.filter((c) => c.claim_status === 'Pending').length;
  const returnedCount =
    overview?.campusStats.totalReturned ?? items.filter((i) => i.status === 'Returned').length;

  const handleDeleteReport = async (itemId: number) => {
    setFeedback(null);
    try {
      await api.deleteItem(itemId);
      setFeedback({ type: 'success', text: `Report #${itemId} deleted.` });
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete report.' });
    }
  };

  const handleClaimDecision = async (
    claimId: number,
    status: ClaimStatus,
    markReturned = false
  ) => {
    setFeedback(null);
    try {
      const res = await api.updateClaimStatus(claimId, {
        status,
        reviewer_note:
          status === 'Approved'
            ? markReturned
              ? 'Verified by item reporter and marked as Returned.'
              : 'Ownership verified by reporter.'
            : 'Ownership details did not match.',
        mark_item_returned: markReturned,
      });
      setFeedback({ type: 'success', text: res.message });
      await loadClaimsData();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Could not update claim.' });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-6 space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {user.department} · {user.student_or_staff_id || user.role.toUpperCase()}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0.5">
            {mode === 'dashboard'
              ? `Welcome back, ${user.name}`
              : 'My Reports & Ownership Claims'}
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onReportLost}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Lost Item
          </button>
          <button
            type="button"
            onClick={onReportFound}
            className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Found Item
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            Explore All Items
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 4-Column Metric Strip */}
      <section
        aria-label="Dashboard statistics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Total Lost Reports
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono-tabular">
              {totalLost}
            </span>
            <span className="text-xs text-slate-500 font-mono-tabular">
              {myReportedItems.filter((i) => i.item_type === 'Lost').length} yours
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Total Found Reports
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono-tabular">
              {totalFound}
            </span>
            <span className="text-xs text-slate-500 font-mono-tabular">
              {myReportedItems.filter((i) => i.item_type === 'Found').length} yours
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Active Claims
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-cyan-700 font-mono-tabular">
              {overview?.campusStats.activeClaims ?? activeClaimsCount}
            </span>
            <span className="text-xs text-slate-500 font-mono-tabular">
              {receivedClaims.filter((c) => c.claim_status === 'Pending').length} awaiting your review
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Successfully Returned Items
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-700 font-mono-tabular">
              {returnedCount}
            </span>
            <span className="text-xs text-slate-500 font-mono-tabular">
              {overview?.campusStats.recoveryRate ?? 33}% recovery rate
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Split: My Reports & Claims Table + Recent Campus Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {/* Segmented Section Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('my-items')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'my-items'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Submitted Reports ({myReportedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('incoming-claims')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'incoming-claims'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Claims on My Reports ({receivedClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my-claims')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'my-claims'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Claim Requests ({submittedClaims.length})
              </button>
            </div>
          </div>

          {/* Tab 1: My Submitted Reports */}
          {activeTab === 'my-items' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {myReportedItems.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    You have not submitted any lost or found reports yet.
                  </p>
                  <p className="text-xs text-slate-500">
                    When you report a lost belonging or log a found item, you can edit details and manage claims here.
                  </p>
                  <div className="pt-1 flex justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={onReportLost}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                    >
                      Report Lost Item
                    </button>
                    <button
                      type="button"
                      onClick={onReportFound}
                      className="px-4 py-2 rounded-lg bg-cyan-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Report Found Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                        <th className="py-3 px-4">Item Report</th>
                        <th className="py-3 px-4">Type &amp; Category</th>
                        <th className="py-3 px-4">Date &amp; Location</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {myReportedItems.map((item) => (
                        <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => onSelectItem(item.item_id)}
                              className="font-semibold text-slate-900 hover:text-cyan-700 text-left cursor-pointer"
                            >
                              {item.title}
                            </button>
                            <p className="text-[11px] text-slate-500 font-mono-tabular mt-0.5">
                              Report #{item.item_id} · {item.claim_count || 0} claim(s)
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span
                              className={
                                item.item_type === 'Lost'
                                  ? 'text-rose-700 font-semibold'
                                  : 'text-cyan-800 font-semibold'
                              }
                            >
                              {item.item_type}
                            </span>{' '}
                            · {item.category}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="font-mono-tabular block">{item.report_date}</span>
                            <span className="text-[11px] text-slate-500 truncate block max-w-[180px]">
                              {item.location}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {item.status}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectItem(item.item_id)}
                                aria-label={`View ${item.title}`}
                                className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditItem(item)}
                                aria-label={`Edit ${item.title}`}
                                className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(item.item_id)}
                                aria-label={`Delete ${item.title}`}
                                className="p-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Incoming Claims on My Reports */}
          {activeTab === 'incoming-claims' && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {loadingClaims ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading claim requests...
                </div>
              ) : receivedClaims.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  No ownership claims have been submitted for your reported items yet.
                </div>
              ) : (
                receivedClaims.map((claim) => (
                  <div key={claim.claim_id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectItem(claim.item_id)}
                          className="font-bold text-slate-900 hover:text-cyan-700 cursor-pointer"
                        >
                          {claim.item_title}
                        </button>
                        <span className="text-slate-500 ml-2">
                          Claimed by <strong>{claim.claimant_name}</strong> ({claim.claimant_department} ·{' '}
                          <span className="font-mono-tabular">{claim.claimant_masked_email}</span>)
                        </span>
                      </div>
                      <span className="font-mono-tabular font-semibold text-slate-800">
                        Status: {claim.claim_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-1">
                      <p>
                        <strong className="text-slate-800">Identifying Features:</strong>{' '}
                        {claim.identifying_features}
                      </p>
                      <p>
                        <strong className="text-slate-800">Verification Note:</strong>{' '}
                        {claim.verification_note}
                      </p>
                    </div>

                    {claim.claim_status === 'Pending' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClaimDecision(claim.claim_id, 'Approved', true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve &amp; Mark Returned
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClaimDecision(claim.claim_id, 'Approved', false)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve (Match Only)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClaimDecision(claim.claim_id, 'Rejected', false)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: My Submitted Claims */}
          {activeTab === 'my-claims' && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {submittedClaims.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    You have not submitted any ownership claims yet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Browse found items in the Explore registry and click &ldquo;Submit Ownership Claim Request&rdquo; to claim a belonging.
                  </p>
                </div>
              ) : (
                submittedClaims.map((claim) => (
                  <div key={claim.claim_id} className="p-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectItem(claim.item_id)}
                        className="text-sm font-bold text-slate-900 hover:text-cyan-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{claim.item_title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`font-semibold font-mono-tabular ${
                          claim.claim_status === 'Approved'
                            ? 'text-emerald-700'
                            : claim.claim_status === 'Rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        Claim Status: {claim.claim_status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Your Verification Statement:</strong> {claim.identifying_features}
                    </p>
                    {claim.reviewer_note && (
                      <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <strong>Reviewer Decision Note:</strong> {claim.reviewer_note}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 font-mono-tabular">
                      Submitted on {claim.created_at.slice(0, 10)} · Claim #{claim.claim_id}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Recent Campus Status Activity Stream */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Campus Activity
              </h2>
              <span className="text-[11px] text-slate-500 font-mono-tabular">
                StatusHistory Log
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(overview?.recentHistory || []).slice(0, 6).map((hist) => (
                <div key={hist.history_id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectItem(hist.item_id)}
                      className="font-semibold text-slate-900 hover:text-cyan-700 cursor-pointer"
                    >
                      Item #{hist.item_id}: {hist.old_status === 'None' ? 'Logged' : hist.old_status} →{' '}
                      {hist.new_status}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      {hist.updated_at.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{hist.note}</p>
                  <p className="text-[11px] text-slate-400">
                    Updated by {hist.updated_by_name} ({hist.updated_by_role})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
