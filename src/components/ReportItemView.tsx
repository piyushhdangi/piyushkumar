import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import {
  ITEM_CATEGORIES,
  CAMPUS_LOCATIONS,
  type ItemCategory,
  type ItemRecord,
} from '../utils/campusLogic';

interface ReportItemViewProps {
  initialType: 'Lost' | 'Found';
  editingItem?: ItemRecord | null;
  onSuccess: (createdOrUpdated: ItemRecord) => void;
  onCancel: () => void;
}

export const ReportItemView: React.FC<ReportItemViewProps> = ({
  initialType,
  editingItem,
  onSuccess,
  onCancel,
}) => {
  const [itemType, setItemType] = useState<'Lost' | 'Found'>(
    editingItem ? editingItem.item_type : initialType
  );
  const [title, setTitle] = useState(editingItem?.title || '');
  const [category, setCategory] = useState<ItemCategory>(
    editingItem?.category || 'ID & Cards'
  );
  const [description, setDescription] = useState(editingItem?.description || '');
  const [reportDate, setReportDate] = useState(
    editingItem?.report_date || new Date().toISOString().slice(0, 10)
  );
  const [locationPreset, setLocationPreset] = useState<string>(
    editingItem && CAMPUS_LOCATIONS.includes(editingItem.location)
      ? editingItem.location
      : editingItem
      ? 'Custom'
      : CAMPUS_LOCATIONS[0]
  );
  const [customLocation, setCustomLocation] = useState(
    editingItem && !CAMPUS_LOCATIONS.includes(editingItem.location)
      ? editingItem.location
      : ''
  );
  const [identifyingDetails, setIdentifyingDetails] = useState(
    editingItem?.identifying_details || ''
  );
  const [verificationQuestion, setVerificationQuestion] = useState(
    editingItem?.verification_question ||
      'Please describe any unique marks, serial numbers, or contents on this item.'
  );
  const [imageData, setImageData] = useState<string | null>(
    editingItem?.image_path || null
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingItem) {
      setItemType(initialType);
    }
  }, [initialType, editingItem]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Please upload a JPEG, PNG, or WebP photograph.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Image size must be under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalLocation =
      locationPreset === 'Custom' ? customLocation.trim() : locationPreset;

    if (!finalLocation || finalLocation.length < 3) {
      setError('Please specify a valid campus building or room location.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.updateItem(editingItem.item_id, {
          title,
          description,
          category,
          item_type: itemType,
          location: finalLocation,
          report_date: reportDate,
          image_data: imageData,
          identifying_details: identifyingDetails,
          verification_question: verificationQuestion,
        });
        onSuccess(res.item);
      } else {
        const res = await api.createItem({
          title,
          description,
          category,
          item_type: itemType,
          location: finalLocation,
          report_date: reportDate,
          image_data: imageData,
          identifying_details: identifyingDetails,
          verification_question: verificationQuestion,
        });
        onSuccess(res.item);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save item report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {editingItem
              ? `Edit Report #${editingItem.item_id}`
              : itemType === 'Lost'
              ? 'Report a Lost Campus Belonging'
              : 'Report a Found Campus Item'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {itemType === 'Lost'
              ? 'Provide accurate details so staff and students can match your lost belonging.'
              : 'Log a found item and set an ownership verification prompt to ensure safe return.'}
          </p>
        </div>

        {/* Report Type Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setItemType('Lost')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              itemType === 'Lost'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lost Item
          </button>
          <button
            type="button"
            onClick={() => setItemType('Found')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              itemType === 'Found'
                ? 'bg-white text-cyan-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Found Item
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label htmlFor="report-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name / Title *
            </label>
            <input
              id="report-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                itemType === 'Lost'
                  ? 'e.g. Lost Blue TI-84 Plus Graphing Calculator'
                  : 'e.g. Found Silver Apple Pencil (2nd Gen)'
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="report-category" className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label htmlFor="report-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Date {itemType === 'Lost' ? 'Lost' : 'Found'} *
            </label>
            <input
              id="report-date"
              type="date"
              required
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          <div className="md:col-span-8">
            <label htmlFor="report-location" className="block text-xs font-semibold text-slate-700 mb-1">
              {itemType === 'Lost' ? 'Approximate Campus Location *' : 'Found Campus Location *'}
            </label>
            <select
              id="report-location"
              value={locationPreset}
              onChange={(e) => setLocationPreset(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="Custom">Other Campus Building / Specific Room...</option>
            </select>
          </div>
        </div>

        {locationPreset === 'Custom' && (
          <div>
            <label htmlFor="custom-location" className="block text-xs font-semibold text-slate-700 mb-1">
              Specify Building, Floor &amp; Room *
            </label>
            <input
              id="custom-location"
              type="text"
              required
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="e.g. Mechanical Engineering Workshop - Room 108"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>
        )}

        <div>
          <label htmlFor="report-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Public Description *
          </label>
          <textarea
            id="report-desc"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe general appearance, brand, color, and circumstances (avoid revealing secret serial numbers publicly if reporting a Found item)..."
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="report-identifying"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Additional Identifying Details (Private to Admin/Owner)
            </label>
            <textarea
              id="report-identifying"
              rows={2}
              value={identifyingDetails}
              onChange={(e) => setIdentifyingDetails(e.target.value)}
              placeholder="e.g. Serial #C02X91, engraving on back, or specific sticker..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          <div>
            <label
              htmlFor="report-question"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Ownership Verification Question
            </label>
            <textarea
              id="report-question"
              rows={2}
              value={verificationQuestion}
              onChange={(e) => setVerificationQuestion(e.target.value)}
              placeholder="Question shown to claimants when requesting ownership..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>
        </div>

        {/* Item Photograph Upload */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">
            Item Photograph (JPEG, PNG, WebP · Max 4MB)
          </span>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <label
              htmlFor="report-image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer transition-colors shrink-0"
            >
              <Upload className="w-4 h-4 text-cyan-700" />
              <span>{imageData ? 'Replace Photograph' : 'Upload Photograph'}</span>
              <input
                id="report-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {imageData ? (
              <div className="flex items-center gap-3">
                <img
                  src={imageData}
                  alt="Uploaded preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Photograph attached
                  </p>
                  <button
                    type="button"
                    onClick={() => setImageData(null)}
                    className="text-red-600 hover:underline mt-0.5 cursor-pointer"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Optional. Adding a clear photo improves campus recovery rates by over 60%.
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {submitting
              ? 'Saving Report...'
              : editingItem
              ? 'Save Report Changes'
              : `Publish ${itemType} Report`}
          </button>
        </div>
      </form>
    </div>
  );
};
