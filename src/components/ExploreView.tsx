import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';
import { ItemCard } from './ItemCard';
import {
  ITEM_CATEGORIES,
  CAMPUS_LOCATIONS,
  filterItems,
  type ItemRecord,
} from '../utils/campusLogic';

interface ExploreViewProps {
  items: ItemRecord[];
  loading: boolean;
  initialFilterType?: 'All' | 'Lost' | 'Found';
  onSelectItem: (itemId: number) => void;
  onReportLost: () => void;
  onReportFound: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  items,
  loading,
  initialFilterType = 'All',
  onSelectItem,
  onReportLost,
  onReportFound,
}) => {
  const [keyword, setKeyword] = useState('');
  const [itemType, setItemType] = useState<'All' | 'Lost' | 'Found'>(initialFilterType);
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredItems = useMemo(() => {
    return filterItems(items, {
      keyword,
      itemType,
      category,
      location,
      status,
      dateFrom,
      dateTo,
    });
  }, [items, keyword, itemType, category, location, status, dateFrom, dateTo]);

  const handleResetFilters = () => {
    setKeyword('');
    setItemType('All');
    setCategory('All');
    setLocation('');
    setStatus('All');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    keyword !== '' ||
    itemType !== 'All' ||
    category !== 'All' ||
    location !== '' ||
    status !== 'All' ||
    dateFrom !== '' ||
    dateTo !== '';

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-6 space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Explore Campus Lost &amp; Found Registry
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search verified reports across university libraries, lecture halls, residences, and cafeterias.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
        </div>
      </div>

      {/* Multi-Criteria Filter Console */}
      <section
        aria-label="Filter items"
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Keyword Search */}
          <div className="md:col-span-5">
            <label htmlFor="explore-search" className="block text-xs font-semibold text-slate-700 mb-1">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="explore-search"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by item title, brand, lanyard, room..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>
          </div>

          {/* Segmented Lost / Found Filter */}
          <div className="md:col-span-3">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Report Type
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              {(['All', 'Lost', 'Found'] as const).map((typeOpt) => (
                <button
                  key={typeOpt}
                  type="button"
                  onClick={() => setItemType(typeOpt)}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    itemType === typeOpt
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {typeOpt}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4">
            <label htmlFor="explore-category" className="block text-xs font-semibold text-slate-700 mb-1">
              Item Category
            </label>
            <select
              id="explore-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              <option value="All">All Categories</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 pt-2 border-t border-slate-100">
          {/* Location Filter */}
          <div className="md:col-span-4">
            <label htmlFor="explore-location" className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Location
            </label>
            <input
              id="explore-location"
              type="text"
              list="campus-locations-list"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by building or hall..."
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
            <datalist id="campus-locations-list">
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <label htmlFor="explore-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Report Status
            </label>
            <select
              id="explore-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Matched">Matched</option>
              <option value="Returned">Returned</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Date From */}
          <div className="md:col-span-2">
            <label htmlFor="explore-date-from" className="block text-xs font-semibold text-slate-700 mb-1">
              From Date
            </label>
            <input
              id="explore-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Date To */}
          <div className="md:col-span-2">
            <label htmlFor="explore-date-to" className="block text-xs font-semibold text-slate-700 mb-1">
              To Date
            </label>
            <input
              id="explore-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Reset Button */}
          <div className="md:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              aria-label="Reset all filters"
              title="Reset all filters"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          Showing <strong className="font-mono-tabular text-slate-900">{filteredItems.length}</strong> of{' '}
          <strong className="font-mono-tabular text-slate-900">{items.length}</strong> campus reports
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-cyan-700 font-semibold hover:underline cursor-pointer"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div className="h-44 bg-slate-100 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            No matching campus reports found
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            No lost or found items matched your current search criteria. Try broadening your filters or submit a new report so campus members are notified.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onReportLost}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Report Lost Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.item_id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      )}
    </div>
  );
};
