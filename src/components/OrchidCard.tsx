import React from 'react';
import { Heart } from 'lucide-react';
import { Orchid } from '../types';
import { getOrchidImageUrls } from '../utils/orchidImages';
import { renderInlineMarkup } from '../utils/inlineMarkup';

interface OrchidCardProps {
  orchid: Orchid;
  onSelect: (id: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e?: React.MouseEvent) => void;
  variant?: 'grid' | 'list';
}

const OrchidCard: React.FC<OrchidCardProps> = ({
  orchid,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  variant = 'grid'
}) => {
  const isList = variant === 'list';

  return (
    <div 
      onClick={() => orchid.id && onSelect(orchid.id)}
      className={`group h-full bg-white border border-[#747878]/10 hover:border-[#56642b]/30 rounded-md overflow-hidden flex transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${isList ? 'min-h-52 flex-row' : 'flex-col'}`}
    >
      {/* Image container */}
      <div className={`relative shrink-0 bg-surface-container overflow-hidden ${isList ? 'w-[38%] min-w-32 border-r border-[#747878]/10' : 'h-56 border-b border-[#747878]/10'}`}>
        <img
          src={getOrchidImageUrls(orchid)[0] || 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80'}
          alt={orchid.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Floating Badges */}
        <div className="absolute left-0 top-3 z-10 flex flex-col items-start gap-1.5">
          {orchid.isPopular && (
            <span className="relative box-border inline-flex h-7 w-fit min-w-0 max-w-none items-center whitespace-nowrap rounded-r-md bg-botanical-green px-3 font-sans text-[10px] font-bold uppercase tracking-wider text-white shadow-md after:pointer-events-none after:absolute after:left-0 after:top-full after:border-r-[9px] after:border-t-[9px] after:border-r-transparent after:border-t-[#3f4b1f] after:content-['']">
              PHỔ BIẾN
            </span>
          )}
          {orchid.hasFragrance && (
            <span className="relative box-border inline-flex h-7 w-fit min-w-0 max-w-none items-center whitespace-nowrap rounded-r-md bg-antique-gold px-3 font-sans text-[10px] font-bold uppercase tracking-wider text-white shadow-md after:pointer-events-none after:absolute after:left-0 after:top-full after:border-r-[9px] after:border-t-[9px] after:border-r-transparent after:border-t-[#a07700] after:content-['']">
              CÓ HƯƠNG THƠM
            </span>
          )}
        </div>

        {/* Favorite/Bookmark Toggle overlay */}
        <button
          onClick={(e) => orchid.id && onToggleBookmark(orchid.id, e)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-[#1a1c1b] hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
          title={isBookmarked ? 'Bỏ lưu' : 'Lưu hoa lan'}
        >
          <Heart 
            size={16} 
            className="transition-transform duration-300 active:scale-125"
            fill={isBookmarked ? '#ef4444' : 'none'} 
            stroke={isBookmarked ? '#ef4444' : 'currentColor'} 
          />
        </button>

        {/* Gray overlay on hover */}
        <div className="absolute inset-0 bg-[#1a1c1b]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Content description */}
      <div className={`flex min-h-0 flex-col flex-grow ${isList ? 'min-w-0 p-4 sm:p-5' : 'p-4'}`}>
        {/* Title and genus */}
        <div className="mb-2 min-h-[58px]">
          <h3 className={`font-serif text-charcoal-text font-medium leading-snug group-hover:text-botanical-green transition-colors ${isList ? 'text-base sm:text-lg' : 'text-lg'}`}>
            {orchid.name}
          </h3>
          <p className="font-serif text-xs text-[#747878] mt-1 tracking-wider font-light">
            {renderInlineMarkup(orchid.englishName)}
          </p>
        </div>

        {/* Description Snippet */}
        <div className={`h-[38px] overflow-hidden text-[11px] leading-[19px] text-[#747878] font-sans mt-2 line-clamp-2 ${isList ? 'mb-3' : 'mb-3'}`}>
          {orchid.shortDescription}
        </div>

        {/* Button link */}
        <button
          className={`text-center border border-[#747878]/30 hover:border-botanical-green bg-transparent group-hover:bg-[#1a1c1b] group-hover:text-white transition-all duration-300 rounded-[2px] py-2 text-[10px] uppercase tracking-widest font-semibold font-sans ${isList ? 'w-fit px-4' : 'w-full'}`}
        >
          XEM CHI TIẾT →
        </button>
      </div>
    </div>
  );
};

export default OrchidCard;
