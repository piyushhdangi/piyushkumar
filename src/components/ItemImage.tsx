import React, { useState } from 'react';
import {
  CreditCard,
  Briefcase,
  Laptop,
  Key,
  BookOpen,
  Droplets,
  Shirt,
  Package,
} from 'lucide-react';
import type { ItemCategory } from '../utils/campusLogic';

interface ItemImageProps {
  src: string | null | undefined;
  alt: string;
  category: ItemCategory;
  className?: string;
}

export const ItemImage: React.FC<ItemImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-48 object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  const renderCategoryIcon = () => {
    const iconProps = { className: 'w-8 h-8 text-slate-600 stroke-[1.75]' };
    switch (category) {
      case 'ID & Cards':
        return <CreditCard {...iconProps} />;
      case 'Wallets & Bags':
        return <Briefcase {...iconProps} />;
      case 'Electronics':
        return <Laptop {...iconProps} />;
      case 'Keys & Access':
        return <Key {...iconProps} />;
      case 'Books & Notes':
        return <BookOpen {...iconProps} />;
      case 'Bottles & Gear':
        return <Droplets {...iconProps} />;
      case 'Apparel & Accessories':
        return <Shirt {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50/50 border-b border-slate-200/80 px-4 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center mb-2.5">
          {renderCategoryIcon()}
        </div>
        <p className="text-xs font-medium text-slate-700 line-clamp-1 max-w-[220px]">{alt}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{category} · No photo attached</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
