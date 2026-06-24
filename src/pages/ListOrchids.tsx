import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Heart, HelpCircle, ArrowLeft, User } from 'lucide-react';
import OrchidCard from '../components/OrchidCard';
import { INITIAL_ORCHIDS, INITIAL_CATEGORIES, orchidData } from '../data';
import { Orchid } from '../types';

interface ListOrchidsProps {
  categoryId?: string | null;
  onNavigate: (screen: string, id?: string) => void;
}

export default function ListOrchids({ categoryId, onNavigate }: ListOrchidsProps) {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Bookmark state (saved in localStorage)
  const [savedOrchids, setSavedOrchids] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Initialize selectedCategories dynamically based on INITIAL_CATEGORIES
  useEffect(() => {
    const initialCats: Record<string, boolean> = {};
    INITIAL_CATEGORIES.forEach(cat => {
      initialCats[cat.id] = false;
    });
    if (categoryId) {
      initialCats[categoryId] = true;
    }
    setSelectedCategories(initialCats);
  }, [categoryId]);

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
  }, [searchQuery, selectedCategories, showSavedOnly]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    const resetCats: Record<string, boolean> = {};
    INITIAL_CATEGORIES.forEach(cat => {
      resetCats[cat.id] = false;
    });
    setSelectedCategories(resetCats);
    setShowSavedOnly(false);
  };

  // Logic to calculate filtered list
  const getFilteredOrchids = () => {
    return INITIAL_ORCHIDS.filter(orchid => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = orchid.name.toLowerCase().includes(query);
        const matchesSciName = orchid.englishName.toLowerCase().includes(query);
        const matchesDesc = orchid.shortDescription.toLowerCase().includes(query);
        if (!matchesName && !matchesSciName && !matchesDesc) {
          return false;
        }
      }

      // 2. Category filter (OR inside group if any checked)
      const hasAnyCatFilter = Object.values(selectedCategories).some(Boolean);
      if (hasAnyCatFilter) {
        const matchesCat = orchid.categoryIds.some(catId => selectedCategories[catId]);
        if (!matchesCat) {
          return false;
        }
      }

      // 3. Saved Only filter
      if (showSavedOnly) {
        if (!savedOrchids.includes(orchid.id)) {
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
    <div className="bg-[#f9f9f7] min-h-screen text-[#1a1c1b] font-sans pt-20">
      {/* 1. Header Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 h-16 bg-[#f9f9f7]/90 backdrop-blur-md border-b border-[#56642b]/5 transition-all">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto h-full">
          {/* Logo */}
          <div className="font-serif italic text-xl md:text-2xl text-botanical-green font-bold tracking-tight select-none">
            Orchids
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => onNavigate('home')} className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors">
              Trang Chủ
            </button>
            
            {/* Direct Category Access Dropdown */}
            <div className="relative group">
              <button onClick={() => onNavigate('list_orchids')} className="font-sans text-xs uppercase tracking-wider font-semibold text-botanical-green border-b-2 border-botanical-green pb-1 transition-all flex items-center gap-1 cursor-pointer">
                DANH MỤC LAN
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white border border-[#747878]/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-3 mt-2 rounded">
                <ul className="flex flex-col">
                  {INITIAL_CATEGORIES.map((cat: any) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => onNavigate('list_orchids', cat.id)}
                        className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#1a1c1b] hover:bg-[#56642b]/5 hover:text-botanical-green transition-colors cursor-pointer"
                      >
                        {cat.name} ({cat.scientificName.split(" ")[0]})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button onClick={() => window.location.href = '/planting-and-care'} className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors">
              Cách trồng và chăm sóc
            </button>
            
            <button onClick={() => window.location.href = '/document'} className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Tài liệu
            </button>
            <button
              onClick={() => window.location.href = '/discussion'}
              className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer"
            >
              Thảo luận
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-5">
            <button
              className="p-1.5 hover:bg-[#56642b]/5 text-botanical-green rounded-full transition-colors cursor-pointer"
              title="Tìm kiếm loài lan"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="p-1.5 hover:bg-[#56642b]/5 text-botanical-green rounded-full transition-colors cursor-pointer"
              title="Trang quản lý hồ sơ"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8 animate-fade-in">
        
        {/* Back and Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-sans tracking-wider text-[#747878] mb-8 uppercase font-medium">
          <button onClick={() => onNavigate('home')} className="hover:text-botanical-green transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <span>&gt;</span>
          <span className="text-[#1a1c1b]">Danh Mục Lan</span>
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
                {INITIAL_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center space-x-3 text-xs text-[#1a1c1b]/80 font-sans cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={selectedCategories[cat.id] || false}
                      onChange={() => handleCategoryChange(cat.id)}
                      className="w-4 h-4 rounded-[2px] border-[#747878]/30 text-botanical-green focus:ring-botanical-green/20 accent-botanical-green transition-all"
                    />
                    <span className="group-hover:text-botanical-green transition-colors">{cat.name} <span className="text-[10px] text-[#747878]">({cat.scientificName})</span></span>
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
                <span className="bg-[#747878]/10 text-[10px] py-0.5 px-2 rounded-full font-bold">
                  {savedOrchids.length}
                </span>
              </button>
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
              <span>Đang hiển thị {filteredOrchids.length} loài lan</span>
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
                    isBookmarked={savedOrchids.includes(orchid.id)}
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
    </div>
  );
}
