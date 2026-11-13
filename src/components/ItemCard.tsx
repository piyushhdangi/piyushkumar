import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ItemImage } from './ItemImage';
import type { ItemRecord } from '../utils/campusLogic';

interface ItemCardProps {
  item: ItemRecord;
  onSelect: (itemId: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const statusTone =
    item.status === 'Returned'
      ? 'text-emerald-700 font-semibold'
      : item.status === 'Matched'
      ? 'text-cyan-700 font-semibold'
      : item.status === 'Closed'
      ? 'text-slate-500'
      : 'text-amber-700 font-semibold';

  const typeTone =
    item.item_type === 'Lost'
      ? 'text-rose-700 font-semibold'
      : 'text-cyan-800 font-semibold';

  return (
    <article className="group bg-white border border-slate-200/90 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:border-slate-300">
      <div>
        <div className="relative overflow-hidden bg-slate-100">
          <ItemImage
            src={item.image_path}
            alt={item.title}
            category={item.category}
            className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </div>

        <div className="p-5">
          {/* Quiet unboxed 1-line text kicker with typographic separators */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className={typeTone}>{item.item_type} Report</span>
            <span aria-hidden="true">·</span>
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span className={statusTone}>Status: {item.status}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-cyan-800 transition-colors">
            {item.title}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate max-w-[200px]" title={item.location}>
            {item.location}
          </span>
          <span className="font-mono-tabular shrink-0">{item.report_date}</span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(item.item_id)}
          className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
