import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, UserCheck, Search, User, ChevronRight } from 'lucide-react';
import { Category, Orchid, Region, BloomSeason, FlowerColor } from '../types';
import SearchModal from '../components/SearchModal';
import { getOrchidImageUrls } from '../utils/orchidImages';
import { getOrchidById } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { toRichTextHtml } from '../utils/richText';

interface OrchidDetailProps {
  id: string;
  categories: Category[];
  onNavigate: (screen: string, id?: string) => void;
}

export default function OrchidDetail({ id, categories, onNavigate }: OrchidDetailProps) {
  const [orchid, setOrchid] = useState<Orchid | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // Fetch orchid data
  useEffect(() => {
    let cancelled = false;
    setActiveImageIdx(0);
    setOrchid(null);
    setLoadError('');
    void getOrchidById(id)
      .then((result) => {
        if (!cancelled) setOrchid(result);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Không thể tải thông tin loài lan.');
      });

    // check bookmark
    const saved = localStorage.getItem('orchidee-luxe-bookmarks-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsBookmarked(parsed.includes(id));
      } catch (e) {}
    }
    return () => { cancelled = true; };
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const onToggleBookmark = () => {
    let savedBookmarks: string[] = [];
    const saved = localStorage.getItem('orchidee-luxe-bookmarks-v2');
    if (saved) {
      try {
        savedBookmarks = JSON.parse(saved);
      } catch (e) {}
    }

    if (isBookmarked) {
      savedBookmarks = savedBookmarks.filter(bId => bId !== id);
      setIsBookmarked(false);
      showToast('Đã bỏ lưu hoa lan.');
    } else {
      savedBookmarks.push(id);
      setIsBookmarked(true);
      showToast('Đã lưu hoa lan vào danh sách yêu thích!');
    }
    localStorage.setItem('orchidee-luxe-bookmarks-v2', JSON.stringify(savedBookmarks));
    window.dispatchEvent(new Event('orchidee-favorites-updated'));
  };

  if (!orchid) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] pt-24 flex justify-center items-center">
        <p className="text-[#747878] font-sans">{loadError || 'Đang tải thông tin hoa lan...'}</p>
      </div>
    );
  }

  const categoryName = orchid.categoryIds
    .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
    .filter(Boolean)
    .join(', ') || 'Chưa phân loại';

  // Format images
  const images = getOrchidImageUrls(orchid);

  return (
    <div className="bg-[#f9f9f7] min-h-screen text-[#1a1c1b] font-sans">
      {/* 1. Header Navigation Bar */}
      <PublicHeader categories={categories} />

      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        onNavigate={onNavigate} 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8">
        
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#1a1c1b] text-white text-xs px-5 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
            <UserCheck size={16} className="text-botanical-green" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Breadcrumbs / Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-2 font-sans text-xs font-medium tracking-wider text-[#747878]">
            <button 
              onClick={() => onNavigate('home')} 
              className="transition-colors hover:text-botanical-green"
            >
              Trang chủ
            </button>
            <span>/</span>
            <button 
              onClick={() => onNavigate('list_orchids')} 
              className="uppercase transition-colors hover:text-botanical-green"
            >
              Danh Mục Lan
            </button>
            <span>/</span>
            <span className="text-[#1a1c1b] truncate max-w-[200px]">{orchid.name}</span>
          </div>

          <button
            onClick={() => onNavigate('list_orchids')}
            className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#747878] hover:text-botanical-green font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại danh mục</span>
          </button>
        </div>

        {/* Primary detail grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* Left Column: Interactive Image Slider */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="aspect-[4/3] bg-white border border-[#747878]/10 overflow-hidden rounded-md relative shadow-sm">
              {images.length > 0 ? (
                <img
                  src={images[activeImageIdx] ?? images[0]}
                  alt={orchid.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain transition-all duration-500 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-[#747878]">
                  Loài lan này chưa có hình ảnh
                </div>
              )}
            </div>
            
            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((imgUrl, idx) => (
                  <button
                    key={imgUrl}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/3] rounded-md overflow-hidden bg-surface-container border-2 transition-all duration-300 cursor-pointer ${
                      idx === activeImageIdx ? 'border-botanical-green opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Ảnh ${idx + 1} của ${orchid.name}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain bg-white"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Key Orchid Attributes */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-charcoal-text tracking-tight font-medium">
                  {orchid.name}
                </h1>
                <p className="font-serif italic text-lg text-[#735c00] mt-1">
                  {orchid.englishName}
                </p>
              </div>

              <p className="font-sans text-xs md:text-[13px] leading-relaxed text-[#1a1c1b]/80">
                {orchid.shortDescription || 'Chưa có mô tả ngắn.'}
              </p>

              {/* BIO TABLE */}
              <div className="bg-white border border-[#747878]/10 p-5 rounded-md">
                <h4 className="text-[11px] font-semibold tracking-wider text-[#1a1c1b]/80 font-sans mb-3 border-b border-[#747878]/10 pb-2 uppercase">
                  THÔNG TIN SINH HỌC
                </h4>
                <table className="w-full text-xs font-sans">
                  <tbody>
                    <tr className="border-b border-[#747878]/10">
                      <td className="py-2.5 text-[#747878] font-medium">Danh mục</td>
                      <td className="py-2.5 text-[#1a1c1b] text-right font-medium">{categoryName}</td>
                    </tr>
                    <tr className="border-b border-[#747878]/10">
                      <td className="py-2.5 text-[#747878] font-medium">Hương thơm</td>
                      <td className="py-2.5 text-[#1a1c1b] text-right font-medium">{orchid.hasFragrance ? 'Có' : 'Không'}</td>
                    </tr>
                    <tr className="border-b border-[#747878]/10">
                      <td className="py-2.5 text-[#747878] font-medium">Phổ biến</td>
                      <td className="py-2.5 text-[#1a1c1b] text-right font-medium">{orchid.isPopular ? 'Có' : 'Không'}</td>
                    </tr>
                    {orchid.regions && orchid.regions.length > 0 && (
                      <tr className="border-b border-[#747878]/10">
                        <td className="py-2.5 text-[#747878] font-medium">Khu vực phân bố</td>
                        <td className="py-2.5 text-[#1a1c1b] text-right font-medium">
                          {orchid.regions.map(r => Region[r as keyof typeof Region]).filter(Boolean).join(', ')}
                        </td>
                      </tr>
                    )}
                    {orchid.bloomSeasons && orchid.bloomSeasons.length > 0 && (
                      <tr className="border-b border-[#747878]/10">
                        <td className="py-2.5 text-[#747878] font-medium">Mùa hoa nở</td>
                        <td className="py-2.5 text-[#1a1c1b] text-right font-medium">
                          {orchid.bloomSeasons.map(s => BloomSeason[s as keyof typeof BloomSeason]).filter(Boolean).join(', ')}
                        </td>
                      </tr>
                    )}
                    {orchid.colors && orchid.colors.length > 0 && (
                      <tr className="border-b border-[#747878]/10">
                        <td className="py-2.5 text-[#747878] font-medium">Màu sắc hoa</td>
                        <td className="py-2.5 text-[#1a1c1b] text-right font-medium">
                          <div className="flex justify-end gap-1.5 flex-wrap mt-0.5">
                            {orchid.colors.map(c => {
                              const hex = FlowerColor[c as keyof typeof FlowerColor];
                              if (!hex) return null;
                              return (
                                <div key={c} title={c} className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: hex }}></div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions button group */}
            <div className="mt-8">
              <button
                onClick={onToggleBookmark}
                className={`w-full flex items-center justify-center space-x-2 border py-3 px-4 rounded-[2px] text-[11px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 active:scale-[0.98] ${
                  isBookmarked
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-[#1a1c1b]/30 hover:border-botanical-green text-[#1a1c1b] bg-transparent hover:bg-surface-container'
                }`}
              >
                <Heart size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                <span>{isBookmarked ? 'ĐÃ LƯU HOA LAN' : 'LƯU HOA LAN'}</span>
              </button>
            </div>

          </div>
        </div>

        {orchid.detailedDescription && (
          <>
            <hr className="border-t border-[#747878]/10 my-12" />
            <section className="space-y-5 mb-16">
              <div className="flex items-center space-x-3">
                <span className="h-6 w-[2px] bg-botanical-green" />
                <h2 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-charcoal-text">
                  Mô tả chi tiết
                </h2>
              </div>
              <div className="max-w-4xl">
                <div
                  className="prose prose-sm max-w-none font-sans text-[13px] text-[#1a1c1b]/80 prose-headings:font-serif prose-headings:text-[#1a1c1b] prose-p:my-3 prose-p:leading-7 prose-li:my-1 prose-li:leading-7 prose-a:text-[#56642b] prose-a:underline prose-blockquote:border-[#899073] prose-img:rounded-lg prose-table:text-sm"
                  dangerouslySetInnerHTML={{ __html: toRichTextHtml(orchid.detailedDescription) }}
                />
              </div>
            </section>
          </>
        )}

      </div>
      <PublicFooter />
    </div>
  );
}
