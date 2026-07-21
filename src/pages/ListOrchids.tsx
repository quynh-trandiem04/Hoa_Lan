import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Heart, HelpCircle, ArrowLeft, User } from 'lucide-react';
import OrchidCard from '../components/OrchidCard';
import { Category, Orchid, Region, BloomSeason, FlowerColor } from '../types';
import SearchModal from '../components/SearchModal';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { getOrchids } from '../services/api';

interface ListOrchidsProps {
  categoryId?: string | null;
  categories: Category[];
  orchids: Orchid[];
  onNavigate: (screen: string, id?: string) => void;
}

export default function ListOrchids({ categoryId, categories, orchids, onNavigate }: ListOrchidsProps) {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [apiOrchids, setApiOrchids] = useState<Orchid[]>(orchids);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Bookmark state (saved in localStorage)
  const [savedOrchids, setSavedOrchids] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    if (!searchQuery.trim()) setApiOrchids(orchids);
  }, [orchids, searchQuery]);

  useEffect(() => {
    const query = searchQuery.trim();
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('q', query);
    else params.delete('q');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);

    if (!query) {
      setApiOrchids(orchids);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      void getOrchids({ 
        pageNumber: 1, 
        pageSize: 100, 
        searchTerm: query,
        regions: selectedRegions,
        bloomSeasons: selectedSeasons,
        colors: selectedColors
      })
        .then((result) => {
          if (active) setApiOrchids(result);
        })
        .catch(() => {
          if (active) setApiOrchids([]);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, orchids, selectedRegions, selectedSeasons, selectedColors]);

  const categoryOptions = (() => {
    const result: Array<{ category: Category; depth: number }> = [];
    const visited = new Set<string>();
    const appendChildren = (parentId: string | null, depth: number) => {
      categories
        .filter((category) => (category.parentId ?? null) === parentId)
        .forEach((category) => {
          if (visited.has(category.id)) return;
          visited.add(category.id);
          result.push({ category, depth });
          appendChildren(category.id, depth + 1);
        });
    };
    appendChildren(null, 0);
    categories.forEach((category) => {
      if (!visited.has(category.id)) result.push({ category, depth: 0 });
    });
    return result;
  })();

  // Initialize selected categories dynamically from the Categories API.
  useEffect(() => {
    const initialCats: Record<string, boolean> = {};
    categories.forEach(cat => {
      initialCats[cat.id] = false;
    });
    if (categoryId) {
      initialCats[categoryId] = true;
    }
    setSelectedCategories(initialCats);
  }, [categories, categoryId]);

  // Load bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem('orchidee-luxe-bookmarks-v2');
    if (saved) {
      try {
        setSavedOrchids(JSON.parse(saved));
      } catch (e) {
        setSavedOrchids([]);
      }
    }
  }, []);

  // Save bookmarks when updated
  const saveBookmarks = (newBookmarks: string[]) => {
    setSavedOrchids(newBookmarks);
    localStorage.setItem('orchidee-luxe-bookmarks-v2', JSON.stringify(newBookmarks));
    window.dispatchEvent(new Event('orchidee-favorites-updated'));
  };

  // Toggle bookmark function
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (savedOrchids.includes(id)) {
      const updated = savedOrchids.filter(savedId => savedId !== id);
      saveBookmarks(updated);
    } else {
      const updated = [...savedOrchids, id];
      saveBookmarks(updated);
    }
  };

  // Reset pagination when filter parameters shift
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, showSavedOnly, selectedRegions, selectedSeasons, selectedColors]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    const resetCats: Record<string, boolean> = {};
    categories.forEach(cat => {
      resetCats[cat.id] = false;
    });
    setSelectedCategories(resetCats);
    setSelectedRegions([]);
    setSelectedSeasons([]);
    setSelectedColors([]);
    setShowSavedOnly(false);
  };

  // Logic to calculate filtered list
  const getFilteredOrchids = () => {
    const selectedIds = Object.entries(selectedCategories)
      .filter(([, selected]) => selected)
      .map(([id]) => id);
    const matchingCategoryIds = new Set(selectedIds);
    let foundDescendant = true;
    while (foundDescendant) {
      foundDescendant = false;
      categories.forEach((category) => {
        if (category.parentId && matchingCategoryIds.has(category.parentId) && !matchingCategoryIds.has(category.id)) {
          matchingCategoryIds.add(category.id);
          foundDescendant = true;
        }
      });
    }

    return apiOrchids.filter(orchid => {
      // 1. Category filter (OR inside group if any checked)
      const hasAnyCatFilter = selectedIds.length > 0;
      if (hasAnyCatFilter) {
        const matchesCat = orchid.categoryIds.some(catId => matchingCategoryIds.has(catId));
        if (!matchesCat) {
          return false;
        }
      }

      // 2. Saved Only filter
      if (showSavedOnly) {
        if (!orchid.id || !savedOrchids.includes(orchid.id)) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredOrchids = getFilteredOrchids();

  // Compute sublist for current page
  const totalPages = Math.ceil(filteredOrchids.length / PAGE_SIZE) || 1;
  const paginatedOrchids = filteredOrchids.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="bg-[#f9f9f7] min-h-screen text-[#1a1c1b] font-sans">
      {/* 1. Header Navigation Bar */}
      <PublicHeader categories={categories} />

      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        onNavigate={onNavigate} 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8 animate-fade-in">
        
        {/* Back and Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 font-sans text-xs font-medium tracking-wider text-[#747878]">
          <button onClick={() => onNavigate('home')} className="hover:text-botanical-green transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <span>&gt;</span>
          <span className="font-semibold uppercase text-[#1a1c1b]">Danh mục lan</span>
        </div>

        {/* Catalog title section */}
        <div className="mb-12 max-w-3xl">
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal-text font-medium tracking-tight">
            Từ Điển Hoa Lan
          </h1>
          <p className="font-sans text-xs md:text-sm text-[#747878] leading-relaxed mt-3">
            Khám phá vẻ đẹp kỳ diệu và sự đa dạng sinh học của thế giới hoa lan thông qua kho lưu trữ thực vật học cao cấp của chúng tôi.
          </p>
        </div>

        {/* Content Layout: Left Sidebar + Right Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT SIDEBAR FILTERS */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans p-3 pl-9 bg-white rounded border border-[#747878]/20 focus:border-botanical-green outline-none"
              />
              <Search className="w-4 h-4 text-[#747878] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter group: Categories */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-sans font-bold tracking-widest text-[#1a1c1b] uppercase border-b border-[#747878]/10 pb-2">
                PHÂN LOẠI DÒNG LAN
              </h4>
              <div className="space-y-2.5">
                {categoryOptions.map(({ category: cat, depth }) => (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-3 text-xs text-[#1a1c1b]/80 font-sans cursor-pointer group select-none"
                    style={{ paddingLeft: `${depth * 18}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories[cat.id] || false}
                      onChange={() => handleCategoryChange(cat.id)}
                      className="w-4 h-4 rounded-[2px] border-[#747878]/30 text-botanical-green focus:ring-botanical-green/20 accent-botanical-green transition-all"
                    />
                    <span className="group-hover:text-botanical-green transition-colors">{cat.name}</span>
                  </label>
                ))}
                {categoryOptions.length === 0 && (
                  <p className="text-xs text-[#747878]">Chưa có danh mục từ máy chủ.</p>
                )}
              </div>
            </div>

            {/* Filter group: Region */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-sans font-bold tracking-widest text-[#1a1c1b] uppercase border-b border-[#747878]/10 pb-2">
                KHU VỰC PHÂN BỐ
              </h4>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(Region).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedRegions.includes(key) ? 'bg-[#56642b] border-[#56642b]' : 'border-[#747878]/40 group-hover:border-[#56642b]'}`}>
                      {selectedRegions.includes(key) && <Search className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedRegions.includes(key)}
                      onChange={(e) => setSelectedRegions(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}
                    />
                    <span className={`text-sm font-sans transition-colors ${selectedRegions.includes(key) ? 'text-[#1a1c1b] font-medium' : 'text-[#747878] group-hover:text-[#1a1c1b]'}`}>
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter group: BloomSeason */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-sans font-bold tracking-widest text-[#1a1c1b] uppercase border-b border-[#747878]/10 pb-2">
                MÙA HOA NỞ
              </h4>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(BloomSeason).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSeasons.includes(key) ? 'bg-[#56642b] border-[#56642b]' : 'border-[#747878]/40 group-hover:border-[#56642b]'}`}>
                      {selectedSeasons.includes(key) && <Search className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedSeasons.includes(key)}
                      onChange={(e) => setSelectedSeasons(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}
                    />
                    <span className={`text-sm font-sans transition-colors ${selectedSeasons.includes(key) ? 'text-[#1a1c1b] font-medium' : 'text-[#747878] group-hover:text-[#1a1c1b]'}`}>
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter group: Color */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-sans font-bold tracking-widest text-[#1a1c1b] uppercase border-b border-[#747878]/10 pb-2">
                MÀU SẮC HOA
              </h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(FlowerColor).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group" title={key}>
                    <div className={`w-6 h-6 rounded-full border shadow-sm flex items-center justify-center transition-all ${selectedColors.includes(key) ? 'ring-2 ring-offset-1 ring-[#56642b] scale-110' : 'border-[#747878]/20 group-hover:scale-110'}`} style={{ backgroundColor: value }}>
                      {selectedColors.includes(key) && (
                        <div className={`w-2 h-2 rounded-full ${value === '#FFFFFF' || value === '#FFFDD0' ? 'bg-[#56642b]' : 'bg-white'}`}></div>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedColors.includes(key)}
                      onChange={(e) => setSelectedColors(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Sidebar Bookmark view filter toggle */}
            <div className="space-y-4 pt-1">
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`w-full flex items-center justify-between p-3.5 border rounded-md text-xs font-sans font-semibold tracking-wider transition-all duration-300 ${
                  showSavedOnly 
                    ? 'bg-[#56642b]/10 border-botanical-green text-botanical-green shadow-sm' 
                    : 'border-[#747878]/20 hover:border-botanical-green bg-white text-[#1a1c1b]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Heart size={14} fill={showSavedOnly ? 'currentColor' : 'none'} />
                  <span>Chỉ xem lan đã lưu</span>
                </span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showSavedOnly ? 'bg-botanical-green' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showSavedOnly ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </button>
              <p className="text-[10px] font-sans text-[#747878] italic px-2">
                Bật để chỉ hiển thị những loại lan bạn đã đánh dấu yêu thích.
              </p>
            </div>

            {/* Additional informational card block */}
            <div className="bg-white border border-[#747878]/10 p-5 rounded-md space-y-2">
              <h5 className="text-[10px] font-bold tracking-wider text-[#1a1c1b]/60 font-sans flex items-center gap-1">
                <HelpCircle size={12} className="text-antique-gold" />
                ĐẶC ĐIỂM SINH TRƯỞNG
              </h5>
              <p className="text-[11px] font-sans text-[#747878] leading-relaxed italic">
                Các tiêu chí bổ sung đang được cập nhật từ đội ngũ chuyên gia...
              </p>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || Object.values(selectedCategories).some(Boolean) || showSavedOnly) && (
              <button
                onClick={handleClearFilters}
                className="w-full text-center border border-dashed border-red-200 hover:border-red-500 hover:bg-red-50/50 text-red-600 rounded-md py-2.5 text-[10px] uppercase tracking-widest font-semibold font-sans transition-all duration-300"
              >
                XÓA BỘ LỌC
              </button>
            )}

          </div>

          {/* RIGHT GRID CONTENT */}
          <div className="lg:col-span-9 space-y-12">
            
            {/* Top result statistics bar */}
            <div className="flex items-center justify-between text-xs text-[#747878] font-sans border-b border-[#747878]/10 pb-3">
              <span>{isSearching ? 'Đang tìm kiếm bằng API...' : `Đang hiển thị ${filteredOrchids.length} loài lan`}</span>
              {showSavedOnly && (
                <span className="bg-[#56642b]/10 text-botanical-green px-2 py-0.5 text-[10px] rounded-[2px] font-semibold">
                  MỤC ĐÃ LƯU
                </span>
              )}
            </div>

            {/* Sublist Card Grid */}
            {paginatedOrchids.length === 0 ? (
              <div className="text-center py-24 bg-white border border-[#747878]/10 rounded-md flex flex-col items-center justify-center space-y-3">
                <X size={32} className="text-[#747878]/30" />
                <p className="font-sans text-xs text-[#747878] italic">Không tìm thấy loài lan nào phù hợp với bộ lọc hiện tại.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-botanical-green font-sans font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {paginatedOrchids.map((orchid) => (
                  <OrchidCard
                    key={orchid.id}
                    orchid={orchid}
                    onSelect={(id) => onNavigate('orchid_detail', id)}
                    isBookmarked={!!orchid.id && savedOrchids.includes(orchid.id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={`p-2 rounded-md border border-[#747878]/20 flex items-center justify-center transition-all ${
                    currentPage === 1 
                      ? 'text-[#747878]/30 cursor-not-allowed bg-transparent' 
                      : 'text-[#1a1c1b] hover:border-botanical-green bg-white hover:shadow-sm'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-md border text-xs font-sans font-semibold tracking-wider transition-all flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'bg-botanical-green border-botanical-green text-white shadow-sm'
                        : 'border-[#747878]/20 bg-white text-[#1a1c1b] hover:border-botanical-green'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={`p-2 rounded-md border border-[#747878]/20 flex items-center justify-center transition-all ${
                    currentPage === totalPages 
                      ? 'text-[#747878]/30 cursor-not-allowed bg-transparent' 
                      : 'text-[#1a1c1b] hover:border-botanical-green bg-white hover:shadow-sm'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
