import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, UserCheck, X } from 'lucide-react';
import { Category, Orchid, Region, BloomSeason, FlowerColor } from '../types';
import SearchModal from '../components/SearchModal';
import { getOrchidImageUrls } from '../utils/orchidImages';
import { getOrchidById } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { renderInlineMarkup } from '../utils/inlineMarkup';
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
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [magnifier, setMagnifier] = useState<{ x: number; y: number; xPercent: number; yPercent: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewerImageRef = useRef<HTMLImageElement>(null);
  
  // Fetch orchid data
  useEffect(() => {
    let cancelled = false;
    setActiveImageIdx(0);
    setThumbnailStart(0);
    setIsImageViewerOpen(false);
    setMagnifier(null);
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
      } catch {
        // Ignore malformed bookmark data and keep the default state.
      }
    }
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!isImageViewerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageViewerOpen(false);
      if (event.key === 'ArrowLeft' && images.length > 1) {
        setActiveImageIdx((current) => (current - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight' && images.length > 1) {
        setActiveImageIdx((current) => (current + 1) % images.length);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageViewerOpen]);

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
      } catch {
        // Ignore malformed bookmark data and replace it on the next write.
      }
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
  const maxThumbnailStart = Math.max(0, images.length - 4);
  const visibleImages = images.slice(thumbnailStart, thumbnailStart + 4);

  const shiftThumbnails = (direction: -1 | 1) => {
    setThumbnailStart((current) => Math.min(maxThumbnailStart, Math.max(0, current + direction)));
  };

  const handleImageMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const image = imageRef.current;
    if (!image) return;
    const bounds = image.getBoundingClientRect();
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    setMagnifier({
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top,
      xPercent: (x / bounds.width) * 100,
      yPercent: (y / bounds.height) * 100,
    });
  };

  const handleViewerMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    const image = viewerImageRef.current;
    if (!image) return;
    const bounds = image.getBoundingClientRect();
    const containerBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerBounds || !bounds.width || !bounds.height) return;
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    setMagnifier({
      x: event.clientX - containerBounds.left,
      y: event.clientY - containerBounds.top,
      xPercent: (x / bounds.width) * 100,
      yPercent: (y / bounds.height) * 100,
    });
  };

  return (
    <div className="bg-[#f9f9f7] min-h-screen text-[#1a1c1b] font-sans">
      {/* 1. Header Navigation Bar */}
      <PublicHeader categories={categories} />

      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        onNavigate={onNavigate} 
      />

      {isImageViewerOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111412]/85 p-4 backdrop-blur-sm md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Xem ảnh ${activeImageIdx + 1} của ${orchid.name}`}
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20 md:right-7 md:top-7"
            aria-label="Đóng ảnh phóng lớn"
          >
            <X size={23} strokeWidth={1.8} />
          </button>

          <div className="relative flex h-full w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((current) => (current - 1 + images.length) % images.length)}
                  className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg transition hover:bg-white/25 md:left-2 md:h-14 md:w-14"
                  aria-label="Xem ảnh trước"
                >
                  <ChevronLeft size={30} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((current) => (current + 1) % images.length)}
                  className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg transition hover:bg-white/25 md:right-2 md:h-14 md:w-14"
                  aria-label="Xem ảnh tiếp theo"
                >
                  <ChevronRight size={30} strokeWidth={1.8} />
                </button>
              </>
            )}
            <img
              ref={viewerImageRef}
              src={images[activeImageIdx] ?? images[0]}
              alt={orchid.name}
              referrerPolicy="no-referrer"
              onMouseMove={handleViewerMouseMove}
              onMouseLeave={() => setMagnifier(null)}
              className="max-h-full max-w-full cursor-zoom-in rounded-lg object-contain shadow-2xl"
            />
            {magnifier && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute hidden h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/95 bg-no-repeat shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-1 ring-black/30 lg:block"
                style={{
                  left: magnifier.x,
                  top: magnifier.y,
                  backgroundImage: `url(${images[activeImageIdx] ?? images[0]})`,
                  backgroundSize: '350% 350%',
                  backgroundPosition: `${magnifier.xPercent}% ${magnifier.yPercent}%`,
                }}
              />
            )}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white/90">
              {activeImageIdx + 1} / {images.length}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8">
        
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#1a1c1b] text-white text-xs px-5 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
            <UserCheck size={16} className="text-botanical-green" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 font-sans text-xs font-medium tracking-wider text-[#747878]">
            <button 
              onClick={() => onNavigate('home')} 
              className="transition-colors hover:text-botanical-green"
            >
              Trang chủ
            </button>
            <span>&gt;</span>
            <button 
              onClick={() => onNavigate('list_orchids')} 
              className="transition-colors hover:text-botanical-green"
            >
              Danh mục lan
            </button>
            <span>&gt;</span>
            <span className="text-[#1a1c1b] truncate max-w-[200px]">{orchid.name}</span>
          </div>
        </div>

        <div className="mb-12 max-w-3xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal-text md:text-4xl">
            Từ Điển Hoa Lan
          </h1>
          <p className="mt-3 font-sans text-xs leading-relaxed text-[#747878] md:text-sm">
            Khám phá vẻ đẹp kỳ diệu và sự đa dạng sinh học của thế giới hoa lan thông qua kho lưu trữ thực vật học cao cấp của chúng tôi.
          </p>
        </div>

        {/* Primary detail grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* Left Column: Interactive Image Slider */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex min-h-[320px] items-center justify-center rounded-md border border-[#747878]/10 bg-white shadow-sm">
              {images.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsImageViewerOpen(true)}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={() => setMagnifier(null)}
                  className="group relative flex max-h-[70vh] max-w-full cursor-zoom-in items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-botanical-green focus:ring-offset-2"
                  aria-label="Xem ảnh phóng lớn"
                >
                  <img
                    ref={imageRef}
                    src={images[activeImageIdx] ?? images[0]}
                    alt={orchid.name}
                    referrerPolicy="no-referrer"
                    className="block max-h-[70vh] max-w-full object-contain transition-all duration-500 ease-out"
                  />
                  {magnifier && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute hidden h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/95 bg-no-repeat shadow-[0_8px_28px_rgba(0,0,0,0.35)] ring-1 ring-black/20 lg:block"
                      style={{
                        left: magnifier.x,
                        top: magnifier.y,
                        backgroundImage: `url(${images[activeImageIdx] ?? images[0]})`,
                        backgroundSize: '350% 350%',
                        backgroundPosition: `${magnifier.xPercent}% ${magnifier.yPercent}%`,
                      }}
                    />
                  )}
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-[#747878]">
                  Loài lan này chưa có hình ảnh
                </div>
              )}
            </div>
            
            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="relative">
                <div className="grid grid-cols-4 gap-3">
                {visibleImages.map((imgUrl, visibleIdx) => {
                  const idx = thumbnailStart + visibleIdx;
                  return (
                  <button
                    key={imgUrl}
                    onClick={() => {
                      setActiveImageIdx(idx);
                    }}
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
                  );
                })}
                </div>

                {images.length > 4 && (
                  <button
                    type="button"
                    onClick={() => shiftThumbnails(-1)}
                    disabled={thumbnailStart === 0}
                    className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#747878]/15 bg-white/95 text-[#56642b] shadow-sm transition hover:bg-[#f0f2e8] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Xem các ảnh trước"
                    title="Xem các ảnh trước"
                  >
                    <ChevronLeft size={20} strokeWidth={1.8} />
                  </button>
                )}

                {images.length > 4 && (
                  <button
                    type="button"
                    onClick={() => shiftThumbnails(1)}
                    disabled={thumbnailStart === maxThumbnailStart}
                    className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#747878]/15 bg-white/95 text-[#56642b] shadow-sm transition hover:bg-[#f0f2e8] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Xem các ảnh tiếp theo"
                    title="Xem các ảnh tiếp theo"
                  >
                    <ChevronRight size={20} strokeWidth={1.8} />
                  </button>
                )}
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
                <p className="font-serif text-lg text-[#735c00] mt-1">
                  {renderInlineMarkup(orchid.englishName)}
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
