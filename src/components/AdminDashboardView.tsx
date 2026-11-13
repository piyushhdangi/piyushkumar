import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Flag,
} from 'lucide-react';
import { api, type AdminDashboardResponse } from '../services/api';
import type {
  UserRecord,
  UserRole,
  ItemStatus,
  ClaimStatus,
} from '../utils/campusLogic';

interface AdminDashboardViewProps {
  currentUser: Omit<UserRecord, 'password_hash'> | null;
  onSelectItem: (itemId: number) => void;
  onDataMutated: () => void;
  onOpenAdminLogin: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onSelectItem,
  onDataMutated,
  onOpenAdminLogin,
}) => {
  const [adminData, setAdminData] = useState<AdminDashboardResponse | null>(null);
  const [users, setUsers] = useState<
    Array<Omit<UserRecord, 'password_hash'> & { reports_count: number; claims_count: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'claims' | 'users' | 'duplicates'>(
    'moderation'
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdminConsole = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
      ]);
      setAdminData(dashRes);
      setUsers(usersRes.users);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load admin console.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAdminConsole();
    }
  }, [currentUser?.user_id]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">
            SPSU Administrator Sign-In Required
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This console is restricted to authorized SPSU Proctor &amp; System Administrators. Sign in using the SPSU Admin account (<span className="font-mono-tabular">admin@spsu.ac.in</span> / <span className="font-mono-tabular">Admin@123</span>) to access moderation tools.
          </p>
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Open SPSU Admin Login</span>
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (itemId: number, newStatus: ItemStatus) => {
    setFeedback(null);
    try {
      const res = await api.adminUpdateItemStatus(itemId, {
        status: newStatus,
        note: `Admin updated item status to ${newStatus}.`,
      });
      setFeedback({ type: 'success', text: res.message });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleToggleDuplicateFlag = async (itemId: number, currentFlag: boolean) => {
    setFeedback(null);
    try {
      await api.adminUpdateItemStatus(itemId, {
        is_flagged_duplicate: !currentFlag,
        note: !currentFlag
          ? 'Flagged for duplicate/moderation review by Admin.'
          : 'Cleared duplicate flag.',
      });
      setFeedback({
        type: 'success',
        text: !currentFlag
          ? `Report #${itemId} flagged as potential duplicate.`
          : `Report #${itemId} duplicate flag cleared.`,
      });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDeleteReport = async (itemId: number) => {
    setFeedback(null);
    try {
      await api.deleteItem(itemId);
      setFeedback({ type: 'success', text: `Report #${itemId} removed by administrator.` });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleClaimAction = async (
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
              ? 'Approved by SPSU Admin and marked as Returned.'
              : 'Approved by SPSU Admin (Matched).'
            : 'Rejected by SPSU Admin during verification audit.',
        mark_item_returned: markReturned,
      });
      setFeedback({ type: 'success', text: res.message });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setFeedback(null);
    try {
      const res = await api.updateUserRole(userId, newRole);
      setFeedback({ type: 'success', text: res.message });
      await loadAdminConsole();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleToggleEduPolicy = async () => {
    if (!adminData) return;
    try {
      const nextVal = !adminData.settings.requireEduDomain;
      const res = await api.updateAdminSettings(nextVal);
      setFeedback({ type: 'success', text: res.message });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await api.resetDemoData();
      setFeedback({ type: 'success', text: res.message });
      await loadAdminConsole();
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const m = adminData?.metrics;

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-6 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            SPSU Proctor &amp; Security Office · Role-Based Access Control
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0.5">
            SPSU Administrator Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleEduPolicy}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            SPSU Email Policy: {adminData?.settings.requireEduDomain ? 'Strict (@spsu.ac.in)' : 'Open'}
          </button>
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Seed Data
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

      {/* 5-Column Admin Metrics */}
      <section
        aria-label="Administrator metrics"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block">Total Users</span>
          <span className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1 block">
            {m?.totalUsers ?? 4}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {m?.totalStudents ?? 2} students · {m?.totalStaff ?? 1} staff
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block">Total Lost Items</span>
          <span className="text-2xl font-bold text-rose-700 font-mono-tabular mt-1 block">
            {m?.totalLost ?? 3}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Active &amp; historical reports
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block">Total Found Items</span>
          <span className="text-2xl font-bold text-cyan-800 font-mono-tabular mt-1 block">
            {m?.totalFound ?? 3}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Logged at campus desks
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block">Pending Claims</span>
          <span className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1 block">
            {m?.pendingClaims ?? 2}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Awaiting verification
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block">Returned Items</span>
          <span className="text-2xl font-bold text-emerald-700 font-mono-tabular mt-1 block">
            {m?.returnedItems ?? 1}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {m?.matchedItems ?? 1} currently matched
          </span>
        </div>
      </section>

      {/* Segmented Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Report Moderation ({adminData?.recentReports.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Claim Management ({adminData?.claims.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'duplicates'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Duplicate &amp; Post Audit ({adminData?.duplicateAlerts.length ?? 0})
        </button>
      </div>

      {loading && !adminData ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-xl">
          Loading administrator console...
        </div>
      ) : (
        <>
          {/* Tab 1: Report Moderation Table */}
          {activeTab === 'moderation' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 px-4">ID &amp; Title</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Type · Category · Location</th>
                      <th className="py-3 px-4">Update Status</th>
                      <th className="py-3 px-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {(adminData?.recentReports || []).map((item) => (
                      <tr key={item.item_id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => onSelectItem(item.item_id)}
                            className="font-semibold text-slate-900 hover:text-cyan-700 text-left cursor-pointer"
                          >
                            #{item.item_id} {item.title}
                          </button>
                          {item.is_flagged_duplicate && (
                            <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">
                              Flagged as Potential Duplicate
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-medium text-slate-900 block">
                            {item.reporter_name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.reporter_department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span>
                            <strong>{item.item_type}</strong> · {item.category}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {item.location} ({item.report_date})
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            aria-label={`Change status for ${item.title}`}
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item.item_id, e.target.value as ItemStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                          >
                            <option value="Open">Open</option>
                            <option value="Matched">Matched</option>
                            <option value="Returned">Returned</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleDuplicateFlag(item.item_id, item.is_flagged_duplicate)
                              }
                              title="Flag or unflag as duplicate"
                              className={`px-2.5 py-1 rounded border text-xs font-medium flex items-center gap-1 cursor-pointer ${
                                item.is_flagged_duplicate
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Flag className="w-3 h-3" />
                              <span>{item.is_flagged_duplicate ? 'Flagged' : 'Flag'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(item.item_id)}
                              aria-label={`Delete report ${item.title}`}
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
            </div>
          )}

          {/* Tab 2: Claim Management */}
          {activeTab === 'claims' && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {(adminData?.claims || []).map((claim) => (
                <div key={claim.claim_id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono-tabular text-slate-500 mr-2">
                        Claim #{claim.claim_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectItem(claim.item_id)}
                        className="font-bold text-slate-900 hover:text-cyan-700 cursor-pointer"
                      >
                        {claim.item_title}
                      </button>
                      <span className="text-slate-500 ml-2">
                        by <strong>{claim.claimant_name}</strong> ({claim.claimant_department})
                      </span>
                    </div>
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      Status: {claim.claim_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                    <p>
                      <strong>Identifying Features:</strong> {claim.identifying_features}
                    </p>
                    <p>
                      <strong>Verification Note:</strong> {claim.verification_note}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleClaimAction(claim.claim_id, 'Approved', true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve &amp; Mark Returned
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaimAction(claim.claim_id, 'Approved', false)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve (Matched)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaimAction(claim.claim_id, 'Rejected', false)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Claim
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: User Management */}
          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 px-4">Campus User</th>
                      <th className="py-3 px-4">Email &amp; ID</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4 text-right">Role Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {users.map((u) => (
                      <tr key={u.user_id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {u.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-slate-600">
                          {u.email}
                          {u.student_or_staff_id && (
                            <span className="block text-[11px] text-slate-400">
                              ID: {u.student_or_staff_id}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{u.department}</td>
                        <td className="py-3.5 px-4 font-mono-tabular text-slate-600">
                          {u.reports_count} reports · {u.claims_count} claims
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            aria-label={`Change role for ${u.name}`}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.user_id, e.target.value as UserRole)
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                          >
                            <option value="student">student</option>
                            <option value="staff">staff</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Duplicate & Post Audit */}
          {activeTab === 'duplicates' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Automated Similarity &amp; Duplicate Post Detection
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scans reports sharing identical categories, report types, and overlapping title keywords or manual moderator flags.
                </p>
              </div>

              {(adminData?.duplicateAlerts || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No duplicate or flagged posts detected across the campus registry.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {adminData?.duplicateAlerts.map(({ item, matches }) => (
                    <div key={item.item_id} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          #{item.item_id} {item.title}
                        </span>
                        <p className="text-slate-600 mt-0.5">
                          {matches.length > 0
                            ? `Similar to: ${matches.map((m) => `#${m.item_id} (${m.title})`).join(', ')}`
                            : 'Manually flagged for moderator review.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.item_id, 'Closed')}
                          className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                        >
                          Close Post
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(item.item_id)}
                          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                        >
                          Delete Duplicate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
