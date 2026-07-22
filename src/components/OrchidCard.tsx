import React from 'react';
import { Heart } from 'lucide-react';
import { Orchid } from '../types';
import { getOrchidImageUrls } from '../utils/orchidImages';

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
      className={`group bg-white border border-[#747878]/10 hover:border-[#56642b]/30 rounded-md overflow-hidden flex transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${isList ? 'min-h-52 flex-row' : 'flex-col'}`}
    >
      {/* Image container */}
      <div className={`relative shrink-0 bg-surface-container overflow-hidden ${isList ? 'w-[38%] min-w-32 border-r border-[#747878]/10' : 'aspect-[4/3] border-b border-[#747878]/10'}`}>
        <img
          src={getOrchidImageUrls(orchid)[0] || 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80'}
          alt={orchid.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {orchid.isPopular && (
            <span className="bg-botanical-green text-white text-[9px] tracking-widest uppercase font-semibold font-sans px-2.5 py-1 rounded-[2px] shadow-sm">
              ĐƯỢC ƯU CHUỘNG
            </span>
          )}
          {orchid.hasFragrance && (
            <span className="bg-antique-gold text-white text-[9px] tracking-widest uppercase font-semibold font-sans px-2.5 py-1 rounded-[2px] shadow-sm">
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
      <div className={`flex flex-col flex-grow ${isList ? 'min-w-0 p-4 sm:p-5' : 'p-5'}`}>
        {/* Title and genus */}
        <div className="mb-3">
          <h3 className={`font-serif text-charcoal-text font-medium leading-snug group-hover:text-botanical-green transition-colors ${isList ? 'text-base sm:text-lg' : 'text-lg'}`}>
            {orchid.name}
          </h3>
          <p className="font-serif italic text-xs text-[#747878] mt-1 uppercase tracking-wider font-light">
            {orchid.englishName}
          </p>
        </div>

        {/* Description Snippet */}
        <div className={`text-[11px] text-[#747878] font-sans mt-auto line-clamp-3 ${isList ? 'mb-3' : 'mb-5'}`}>
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
