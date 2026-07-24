import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Heart, HelpCircle, ArrowLeft, Grid2X2, List } from 'lucide-react';
import OrchidCard from '../components/OrchidCard';
import { Category, Orchid, Region, BloomSeason, FlowerColor } from '../types';
import SearchModal from '../components/SearchModal';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { getOrchidById, getOrchidsPage } from '../services/api';
import InlineTreeMultiSelect from '../components/InlineTreeMultiSelect';
import PageIntro from '../components/PageIntro';

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
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>(() =>
    localStorage.getItem('orchidee-orchid-sort') === 'za' ? 'za' : 'az'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() =>
    localStorage.getItem('orchidee-orchid-view') === 'list' ? 'list' : 'grid'
  );

  // Bookmark state (saved in localStorage)
  const [savedOrchids, setSavedOrchids] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrchidCount, setTotalOrchidCount] = useState(orchids.length);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    const query = searchQuery.trim();
    const requestedCategoryIds = new Set(Object.entries(selectedCategories)
      .filter(([, selected]) => selected)
      .map(([id]) => id));
    let foundDescendant = true;
    while (foundDescendant) {
      foundDescendant = false;
      categories.forEach((category) => {
        if (category.parentId && requestedCategoryIds.has(category.parentId) && !requestedCategoryIds.has(category.id)) {
          requestedCategoryIds.add(category.id);
          foundDescendant = true;
        }
      });
    }
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('q', query);
    else params.delete('q');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);

    let active = true;
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      if (showSavedOnly) {
        const totalSaved = savedOrchids.length;
        const savedTotalPages = Math.max(1, Math.ceil(totalSaved / PAGE_SIZE));
        const pageIds = savedOrchids.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        void Promise.all(pageIds.map((id) => getOrchidById(id)))
          .then((items) => {
            if (!active) return;
            setApiOrchids(items);
            setTotalOrchidCount(totalSaved);
            setTotalPages(savedTotalPages);
          })
          .catch(() => {
            if (active) setApiOrchids([]);
          })
          .finally(() => {
            if (active) setIsSearching(false);
          });
        return;
      }

      void getOrchidsPage({
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
        searchTerm: query || undefined,
        categoryIds: [...requestedCategoryIds],
        regions: selectedRegions,
        bloomSeasons: selectedSeasons,
        colors: selectedColors,
        sortBy: 'name',
        sortDescending: sortOrder === 'za'
      })
        .then((result) => {
          if (!active) return;
          setApiOrchids(result.items);
          setTotalOrchidCount(result.totalCount);
          setTotalPages(Math.max(1, result.totalPages));
        })
        .catch(() => {
          if (!active) return;
          setApiOrchids([]);
          setTotalOrchidCount(0);
          setTotalPages(1);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, selectedCategories, categories, selectedRegions, selectedSeasons, selectedColors, sortOrder, currentPage, showSavedOnly, savedOrchids]);

  useEffect(() => {
    localStorage.setItem('orchidee-orchid-sort', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem('orchidee-orchid-view', viewMode);
  }, [viewMode]);

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
  const selectedCategoryIds = Object.entries(selectedCategories)
    .filter(([, selected]) => selected)
    .map(([id]) => id);

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
      } catch {
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
  }, [searchQuery, selectedCategories, showSavedOnly, selectedRegions, selectedSeasons, selectedColors, sortOrder]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPageTop = () => {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  // API already returns exactly one page, so the frontend does not slice a large result set.
  const paginatedOrchids = apiOrchids;

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
          <span className="font-semibold text-[#1a1c1b]">Danh mục lan</span>
        </div>

        <PageIntro
          eyebrow="Khám phá thế giới hoa lan"
          title="Từ Điển Hoa Lan"
          description="Khám phá vẻ đẹp kỳ diệu và sự đa dạng sinh học của thế giới hoa lan thông qua kho lưu trữ thực vật học cao cấp của chúng tôi."
        />

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
              <h4 className="border-b border-[#747878]/10 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#1a1c1b]">PHÂN LOẠI DÒNG LAN</h4>
              <InlineTreeMultiSelect
                options={categoryOptions.map(({ category, depth }) => ({ value: category.id, label: category.name, depth }))}
                values={selectedCategoryIds}
                onChange={(values) => {
                  const next: Record<string, boolean> = {};
                  categories.forEach((category) => { next[category.id] = values.includes(category.id); });
                  setSelectedCategories(next);
                  scrollToPageTop();
                }}
                allLabel="Tất cả dòng lan"
                emptyMessage="Chưa có danh mục từ máy chủ."
              />
            </div>

            {/* Filter group: Region */}
            <div className="space-y-5">
              <h4 className="border-b border-[#747878]/15 pb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#111312]">
                KHU VỰC PHÂN BỐ
              </h4>

              <button
                type="button"
                onClick={() => {
                  setSelectedRegions([]);
                  scrollToPageTop();
                }}
                className={`block w-full rounded-sm text-left text-[15px] leading-6 transition-colors hover:text-[#315f24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87905f] ${
                  selectedRegions.length === 0 ? 'font-semibold text-[#315f24]' : 'font-normal text-[#1a1c1b]'
                }`}
                aria-pressed={selectedRegions.length === 0}
              >
                Tất cả khu vực
              </button>

              <div className="relative ml-3 border-l border-[#d8dbd5] py-1">
                {Object.entries(Region).map(([value, label]) => {
                  const selected = selectedRegions.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSelectedRegions((current) =>
                          selected ? current.filter((item) => item !== value) : [...current, value]
                        );
                        scrollToPageTop();
                      }}
                      className={`relative block min-h-12 w-full rounded-sm py-3 pl-5 pr-1 text-left text-[14px] leading-5 transition-colors hover:text-[#315f24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87905f] ${
                        selected ? 'font-bold text-[#315f24]' : 'font-normal text-[#171918]'
                      }`}
                      aria-pressed={selected}
                    >
                      {selected && (
                        <span
                          className="absolute -left-[3px] top-1/2 h-8 w-[5px] -translate-y-1/2 rounded-full bg-[#4da83d]"
                          aria-hidden="true"
                        />
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter group: BloomSeason */}
            <div className="space-y-4">
              <h4 className="border-b border-[#747878]/10 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#1a1c1b]">MÙA HOA NỞ</h4>
              <InlineTreeMultiSelect
                options={Object.entries(BloomSeason).map(([value, label]) => ({ value, label }))}
                values={selectedSeasons}
                onChange={(values) => {
                  setSelectedSeasons(values);
                  scrollToPageTop();
                }}
                allLabel="Tất cả mùa hoa"
              />
            </div>

            {/* Filter group: Color */}
            <div className="space-y-4">
              <h4 className="border-b border-[#747878]/10 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#1a1c1b]">MÀU SẮC HOA</h4>
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
                      onChange={(e) => {
                        setSelectedColors(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key));
                        scrollToPageTop();
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Sidebar Bookmark view filter toggle */}
            <div className="space-y-4 pt-1">
              <button
                onClick={() => {
                  setShowSavedOnly(!showSavedOnly);
                  scrollToPageTop();
                }}
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
            {(searchQuery || Object.values(selectedCategories).some(Boolean) || selectedRegions.length > 0 || selectedSeasons.length > 0 || selectedColors.length > 0 || showSavedOnly) && (
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
            <div className="flex flex-col gap-3 border-b border-[#747878]/10 pb-3 font-sans text-xs text-[#747878] sm:flex-row sm:items-center sm:justify-between">
              <span>{isSearching ? 'Đang tải dữ liệu...' : `Tìm thấy ${totalOrchidCount} loài lan`}</span>
              <div className="flex flex-wrap items-center gap-2">
                {showSavedOnly && (
                  <span className="bg-[#56642b]/10 text-botanical-green px-2 py-0.5 text-[10px] rounded-[2px] font-semibold">
                    MỤC ĐÃ LƯU
                  </span>
                )}
                <label className="sr-only" htmlFor="orchid-sort">Sắp xếp danh sách hoa lan</label>
                <select
                  id="orchid-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as 'az' | 'za')}
                  className="h-10 min-w-40 rounded-md border border-[#747878]/20 bg-white px-3 text-xs font-medium text-[#1a1c1b] outline-none transition-colors hover:border-[#56642b]/50 focus:border-botanical-green"
                >
                  <option value="az">Sắp xếp: Tên A–Z</option>
                  <option value="za">Sắp xếp: Tên Z–A</option>
                </select>
                <div className="flex items-center gap-1" role="group" aria-label="Kiểu hiển thị">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${viewMode === 'grid' ? 'border-[#56642b]/30 bg-[#56642b]/10 text-botanical-green' : 'border-[#747878]/20 bg-white text-[#747878] hover:border-[#56642b]/50 hover:text-botanical-green'}`}
                    aria-label="Hiển thị dạng lưới"
                    aria-pressed={viewMode === 'grid'}
                    title="Dạng lưới"
                  >
                    <Grid2X2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${viewMode === 'list' ? 'border-[#56642b]/30 bg-[#56642b]/10 text-botanical-green' : 'border-[#747878]/20 bg-white text-[#747878] hover:border-[#56642b]/50 hover:text-botanical-green'}`}
                    aria-label="Hiển thị dạng danh sách ngang"
                    aria-pressed={viewMode === 'list'}
                    title="Dạng danh sách ngang"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
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
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8'
                : 'grid grid-cols-1 gap-5 xl:grid-cols-2'
              }>
                {paginatedOrchids.map((orchid) => (
                  <OrchidCard
                    key={orchid.id}
                    orchid={orchid}
                    onSelect={(id) => onNavigate('orchid_detail', id)}
                    isBookmarked={!!orchid.id && savedOrchids.includes(orchid.id)}
                    onToggleBookmark={handleToggleBookmark}
                    variant={viewMode}
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
