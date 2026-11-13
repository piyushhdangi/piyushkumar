import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { ItemImage } from './ItemImage';
import type {
  ItemRecord,
  ClaimRecord,
  StatusHistoryRecord,
  UserRecord,
  ClaimStatus,
} from '../utils/campusLogic';

interface ItemDetailModalProps {
  itemId: number | null;
  onClose: () => void;
  currentUser: Omit<UserRecord, 'password_hash'> | null;
  onOpenAuth: () => void;
  onEditItem: (item: ItemRecord) => void;
  onDataMutated: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  onClose,
  currentUser,
  onOpenAuth,
  onEditItem,
  onDataMutated,
}) => {
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Claim Submission Form State
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadItemDetail = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getItemDetail(id);
      setItem(data.item);
      setStatusHistory(data.statusHistory);
      setClaims(data.claims);
    } catch (err: any) {
      setError(err.message || 'Could not load item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId !== null) {
      setFeedback(null);
      setShowClaimForm(false);
      setIdentifyingFeatures('');
      setVerificationNote('');
      setConfirmDelete(false);
      loadItemDetail(itemId);
    }
  }, [itemId, currentUser?.user_id]);

  if (itemId === null) return null;

  const isOwner = Boolean(currentUser && item && currentUser.user_id === item.user_id);
  const isAdmin = currentUser?.role === 'admin';
  const canManage = isOwner || isAdmin;
  const userExistingClaim = claims.find((c) => c.claimant_id === currentUser?.user_id);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFeedback(null);
    setSubmittingClaim(true);
    try {
      const res = await api.createClaim({
        item_id: item.item_id,
        identifying_features: identifyingFeatures,
        verification_note: verificationNote,
      });
      setFeedback({ type: 'success', text: res.message });
      setShowClaimForm(false);
      setIdentifyingFeatures('');
      setVerificationNote('');
      await loadItemDetail(item.item_id);
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Claim submission failed.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReviewClaim = async (
    claimId: number,
    status: ClaimStatus,
    markReturned = false
  ) => {
    if (!item) return;
    setFeedback(null);
    try {
      const res = await api.updateClaimStatus(claimId, {
        status,
        reviewer_note:
          status === 'Approved'
            ? markReturned
              ? 'Ownership verified and item handed over to claimant.'
              : 'Ownership verified. Ready for pickup.'
            : 'Verification details did not match the item record.',
        mark_item_returned: markReturned,
      });
      setFeedback({ type: 'success', text: res.message });
      await loadItemDetail(item.item_id);
      onDataMutated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Could not update claim status.' });
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await api.deleteItem(item.item_id);
      onDataMutated();
      onClose();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete report.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono-tabular">Report #{item?.item_id ?? itemId}</span>
            {item && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-800">{item.item_type} Item</span>
                <span aria-hidden="true">·</span>
                <span>{item.category}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading report details...
            </div>
          ) : error || !item ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error || 'Item not found.'}
            </div>
          ) : (
            <>
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

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <ItemImage
                    src={item.image_path}
                    alt={item.title}
                    category={item.category}
                    className="w-full h-60 object-cover"
                  />
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span
                        className={
                          item.item_type === 'Lost'
                            ? 'text-rose-700 font-semibold'
                            : 'text-cyan-800 font-semibold'
                        }
                      >
                        {item.item_type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Status: <strong className="text-slate-900">{item.status}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">Reported {item.report_date}</span>
                    </div>

                    <h2 id="item-detail-title" className="text-xl font-bold text-slate-900">
                      {item.title}
                    </h2>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>

                  {/* Location & Privacy-Safe Reporter Metadata */}
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Campus Location</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {item.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        Reported By (Privacy Protected)
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {item.reporter_name} ({item.reporter_role})
                      </span>
                      <span className="text-slate-500 font-mono-tabular block">
                        {item.reporter_department} · {item.reporter_masked_email}
                      </span>
                    </div>
                  </div>

                  {canManage && item.identifying_details && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800 block mb-0.5">
                        Private Identifying Details (Visible only to Reporter &amp; Admin):
                      </span>
                      <p className="text-slate-600">{item.identifying_details}</p>
                    </div>
                  )}

                  {/* Owner / Admin Actions or Claimant Action */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    {!isOwner && item.status !== 'Returned' && item.status !== 'Closed' && (
                      <>
                        {userExistingClaim ? (
                          <div className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2">
                            Your Claim Request Status:{' '}
                            <strong className="text-slate-900">
                              {userExistingClaim.claim_status}
                            </strong>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser) {
                                onOpenAuth();
                              } else {
                                setShowClaimForm((prev) => !prev);
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {item.item_type === 'Found'
                              ? 'Submit Ownership Claim Request'
                              : 'Report Matching Found Item / Claim'}
                          </button>
                        )}
                      </>
                    )}

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditItem(item);
                          }}
                          className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Report
                        </button>

                        {!confirmDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="px-3.5 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Report
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleDelete}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(false)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Ownership Claim Submission Form */}
              {showClaimForm && currentUser && !isOwner && (
                <form
                  onSubmit={handleClaimSubmit}
                  className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Ownership Verification &amp; Claim Request
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Verification Prompt:{' '}
                      <strong className="text-slate-800">
                        {item.verification_question ||
                          'Please describe unique marks, contents, or serial numbers on this item.'}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="claim-features"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Answer &amp; Description of Identifying Features
                    </label>
                    <textarea
                      id="claim-features"
                      rows={2}
                      required
                      value={identifyingFeatures}
                      onChange={(e) => setIdentifyingFeatures(e.target.value)}
                      placeholder="Describe specific brand marks, engravings, contents, or serial numbers..."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="claim-note"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Additional Verification Note (When &amp; Where Lost/Found)
                    </label>
                    <textarea
                      id="claim-note"
                      rows={2}
                      required
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      placeholder="Provide context on when you last had the item and how Campus Security or the finder can verify ownership..."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClaim}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {submittingClaim ? 'Submitting Claim...' : 'Submit Claim Request'}
                    </button>
                  </div>
                </form>
              )}

              {/* Claims List (Visible to Authorized Owner / Admin, or Claimant's own claim) */}
              {claims.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {canManage
                      ? `Submitted Ownership Claims (${claims.length})`
                      : 'Your Submitted Claim Request'}
                  </h3>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                    {claims.map((claim) => (
                      <div key={claim.claim_id} className="p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="font-semibold text-slate-900">
                              {claim.claimant_name}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{claim.claimant_department}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {claim.claimant_masked_email}
                            </span>
                          </div>
                          <span className="font-mono-tabular font-semibold text-slate-800">
                            Status: {claim.claim_status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1">
                          <p>
                            <span className="text-slate-500">Identifying Features:</span>{' '}
                            {claim.identifying_features}
                          </p>
                          <p>
                            <span className="text-slate-500">Verification Context:</span>{' '}
                            {claim.verification_note}
                          </p>
                          {claim.reviewer_note && (
                            <p className="text-slate-600 italic">
                              Reviewer Note: {claim.reviewer_note}
                            </p>
                          )}
                        </div>

                        {canManage && claim.claim_status === 'Pending' && (
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReviewClaim(claim.claim_id, 'Approved', false)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve &amp; Match
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewClaim(claim.claim_id, 'Approved', true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve &amp; Mark Returned
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewClaim(claim.claim_id, 'Rejected', false)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject Claim
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History Audit Trail */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900">Status Audit History</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/60">
                  {statusHistory.map((entry) => (
                    <div
                      key={entry.history_id}
                      className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {entry.old_status === 'None'
                            ? `Created (${entry.new_status})`
                            : `${entry.old_status} → ${entry.new_status}`}
                        </span>
                        {entry.note && <span className="text-slate-600"> — {entry.note}</span>}
                      </div>
                      <div className="text-slate-500 font-mono-tabular">
                        {entry.updated_by_name} · {entry.updated_at.slice(0, 10)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
