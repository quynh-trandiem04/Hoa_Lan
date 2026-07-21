import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, LogOut, Search, User, X } from 'lucide-react';
import type { Category } from '../types';
import { getCategories } from '../services/api';

interface PublicHeaderProps {
  categories?: Category[];
}

const activeClass = 'text-botanical-green border-b-2 border-botanical-green pb-1';
const normalClass = 'text-on-surface-variant hover:text-botanical-green';

const readFavoriteCount = () => {
  try {
    const value = JSON.parse(localStorage.getItem('orchidee-luxe-bookmarks-v2') || '[]');
    return Array.isArray(value) ? new Set(value.filter((id) => typeof id === 'string')).size : 0;
  } catch {
    return 0;
  }
};

const CascadingMenuDropdown = ({ categories, rootNames, basePath }: { categories: Category[], rootNames: string[], basePath: string }) => {
  const root = useMemo(() => categories.find(c => rootNames.some(name => c.name.toLowerCase() === name.toLowerCase()) && !c.parentId), [categories, rootNames]);
  const level1Cats = useMemo(() => root ? categories.filter(c => c.parentId === root.id) : [], [categories, root]);
  
  return (
    <div className="invisible absolute left-0 top-[calc(100%-7px)] z-50 min-w-[260px] rounded border border-[#747878]/10 bg-white shadow-xl opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
      <ul className="flex flex-col py-2">
        {level1Cats.map(cat => {
          const children = categories.filter(c => c.parentId === cat.id);
          const hasChildren = children.length > 0;
          return (
            <li key={cat.id} className="group/item relative">
              <a href={`${basePath}?cat=${encodeURIComponent(cat.id)}`} className="flex items-center justify-between w-full px-5 py-3 text-[13.5px] font-sans text-[#1a1c1b] transition-colors hover:bg-[#56642b]/5 hover:text-botanical-green">
                {cat.name}
                {hasChildren && <ChevronRight className="h-3.5 w-3.5 text-outline" />}
              </a>
              
              {hasChildren && (
                <div className="invisible absolute left-[100%] top-0 z-50 min-w-[260px] rounded border border-[#747878]/10 bg-white shadow-xl opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:opacity-100">
                  <ul className="flex flex-col py-2">
                    {children.map(child => {
                      const grandChildren = categories.filter(c => c.parentId === child.id);
                      const hasGrandChildren = grandChildren.length > 0;
                      return (
                        <li key={child.id} className="group/subitem relative">
                          <a href={`${basePath}?cat=${encodeURIComponent(child.id)}`} className="flex items-center justify-between w-full px-5 py-2.5 text-[14px] font-sans text-[#434748] transition-colors hover:bg-[#56642b]/5 hover:text-botanical-green">
                            {child.name}
                            {hasGrandChildren && <ChevronRight className="h-3.5 w-3.5 text-outline" />}
                          </a>
                          
                          {hasGrandChildren && (
                            <div className="invisible absolute left-[100%] top-0 z-50 min-w-[260px] rounded border border-[#747878]/10 bg-white shadow-xl opacity-0 transition-all duration-200 group-hover/subitem:visible group-hover/subitem:opacity-100">
                              <ul className="flex flex-col py-2">
                                {grandChildren.map(grandChild => (
                                  <li key={grandChild.id}>
                                    <a href={`${basePath}?cat=${encodeURIComponent(grandChild.id)}`} className="block w-full px-5 py-2.5 text-[14px] font-sans text-[#434748] transition-colors hover:bg-[#56642b]/5 hover:text-botanical-green">
                                      {grandChild.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
        {level1Cats.length === 0 && <li className="px-5 py-2 text-xs text-[#747878]">Chưa có danh mục</li>}
      </ul>
    </div>
  );
};

export default function PublicHeader({ categories: suppliedCategories }: PublicHeaderProps) {
  const [loadedCategories, setLoadedCategories] = useState<Category[]>(suppliedCategories ?? []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(readFavoriteCount);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileCloseTimerRef = useRef<number | null>(null);
  const path = window.location.pathname;

  useEffect(() => {
    if (suppliedCategories) {
      setLoadedCategories(suppliedCategories);
      return;
    }
    let active = true;
    void getCategories({ pageNumber: 1, pageSize: 100 })
      .then((result) => { if (active) setLoadedCategories(result.items); })
      .catch(() => { if (active) setLoadedCategories([]); });
    return () => { active = false; };
  }, [suppliedCategories]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeProfileMenu);
    return () => document.removeEventListener('mousedown', closeProfileMenu);
  }, []);

  useEffect(() => {
    const refreshFavoriteCount = () => setFavoriteCount(readFavoriteCount());
    window.addEventListener('storage', refreshFavoriteCount);
    window.addEventListener('orchidee-favorites-updated', refreshFavoriteCount);
    return () => {
      window.removeEventListener('storage', refreshFavoriteCount);
      window.removeEventListener('orchidee-favorites-updated', refreshFavoriteCount);
    };
  }, []);

  const openProfileMenu = () => {
    if (profileCloseTimerRef.current) window.clearTimeout(profileCloseTimerRef.current);
    setFavoriteCount(readFavoriteCount());
    setProfileMenuOpen(true);
  };

  const scheduleProfileMenuClose = () => {
    profileCloseTimerRef.current = window.setTimeout(() => setProfileMenuOpen(false), 120);
  };

  const handleLogout = () => {
    ['orchidee_admin_user', 'orchidee_auth', 'orchidee_auth_token', 'orchidee_user'].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    setProfileMenuOpen(false);
    window.location.replace('/');
  };

  const ungDungCat = useMemo(() => loadedCategories.find(c => c.name.toLowerCase() === 'ứng dụng' && !c.parentId), [loadedCategories]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchTerm.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const targetPath = path === '/discussion' ? '/discussion' : '/list-orchids';
    window.location.href = `${targetPath}${params.size ? `?${params.toString()}` : ''}`;
  };

  const isCatalog = path === '/list-orchids' || path.startsWith('/orchids/');
  const isAuthenticated = Boolean(
    localStorage.getItem('orchidee_auth_token')
    || sessionStorage.getItem('orchidee_auth_token'),
  );

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#56642b]/10 bg-surface-cream/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-16">
        <a href="/" className="select-none font-serif text-xl font-bold italic tracking-tight text-botanical-green md:text-2xl">Orchids</a>

        <nav className="hidden h-full items-center space-x-8 md:flex">
          <a href="/" className={`font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${path === '/' ? activeClass : normalClass}`}>Trang chủ</a>

          <div className="group relative flex h-full items-center">
            <a href="/list-orchids" className={`flex cursor-pointer items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${isCatalog ? activeClass : normalClass}`}>
              Danh mục lan <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </a>
            <CascadingMenuDropdown categories={loadedCategories} rootNames={['Danh mục lan']} basePath="/list-orchids" />
          </div>

          <div className="group relative flex h-full items-center">
            <a href="/planting-and-care" className={`flex cursor-pointer items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${path === '/planting-and-care' ? activeClass : normalClass}`}>
              Cách trồng và chăm sóc <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </a>
            <CascadingMenuDropdown categories={loadedCategories} rootNames={['Trồng và chăm sóc', 'Cách trồng và chăm sóc']} basePath="/planting-and-care" />
          </div>

          <a href={ungDungCat ? `/list-orchids?cat=${encodeURIComponent(ungDungCat.id)}` : "/list-orchids"} className={`font-sans text-xs font-semibold uppercase tracking-wider transition-colors normalClass`}>Ứng dụng</a>
          <a href="/document" className={`font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${path === '/document' ? activeClass : normalClass}`}>Tài liệu</a>
          <a href="/discussion" className={`font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${path === '/discussion' ? activeClass : normalClass}`}>Thảo luận</a>
        </nav>

        <div className="flex h-full items-center space-x-5">
          <button
            type="button"
            onClick={() => setSearchOpen((current) => !current)}
            className="rounded-full p-1.5 text-botanical-green transition-colors hover:bg-[#56642b]/5"
            title="Tìm kiếm loài lan"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          <div
            ref={profileMenuRef}
            className="relative flex h-full items-center"
            onMouseEnter={openProfileMenu}
            onMouseLeave={scheduleProfileMenuClose}
          >
            <button
              type="button"
              onClick={() => {
                setFavoriteCount(readFavoriteCount());
                setProfileMenuOpen((current) => !current);
              }}
              className={`rounded-full p-1.5 text-botanical-green transition-colors hover:bg-[#56642b]/5 ${profileMenuOpen ? 'bg-[#56642b]/10' : ''}`}
              aria-label={isAuthenticated ? 'Mở menu tài khoản' : 'Mở menu đăng nhập'}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <User className="h-5 w-5" />
              {isAuthenticated && favoriteCount > 0 && (
                <span className="absolute right-0 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#56642b] px-1 text-[9px] font-bold leading-none text-white">
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-[calc(100%-7px)] z-50 w-64 overflow-hidden rounded-lg border border-[#747878]/10 bg-white py-2 shadow-xl" role="menu">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-[#eeeeea] px-5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#899073]">Tài khoản của bạn</p>
                    </div>
                    <a href="/profile" className="block px-5 py-3 font-serif text-sm text-[#1a1c1b] transition-colors hover:bg-[#56642b]/5 hover:text-[#56642b]" role="menuitem">
                      Thông tin tài khoản
                    </a>
                    <a href="/profile?tab=favorites" className="flex items-center justify-between gap-3 px-5 py-3 font-serif text-sm text-[#1a1c1b] transition-colors hover:bg-[#56642b]/5 hover:text-[#56642b]" role="menuitem">
                      <span>Lan yêu thích</span>
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#56642b]/10 px-1.5 font-sans text-[10px] font-bold text-[#56642b]">{favoriteCount}</span>
                    </a>
                    <div className="mt-1 border-t border-[#eeeeea] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-5 py-3 text-left font-serif text-sm text-red-600 transition-colors hover:bg-red-50"
                        role="menuitem"
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block px-5 py-3 font-serif text-sm text-[#1a1c1b] transition-colors hover:bg-[#56642b]/5 hover:text-[#56642b]" role="menuitem">Đăng nhập</a>
                    <a href="/signup" className="block px-5 py-3 font-serif text-sm text-[#1a1c1b] transition-colors hover:bg-[#56642b]/5 hover:text-[#56642b]" role="menuitem">Đăng ký tài khoản</a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={handleSearch} className="absolute right-6 top-[calc(100%+8px)] z-50 flex w-[calc(100%-3rem)] max-w-sm items-center rounded-lg border border-[#d5d7d3] bg-white p-2 shadow-xl md:right-16">
            <Search className="ml-1 h-4 w-4 shrink-0 text-[#747878]" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
              placeholder={path === '/discussion' ? 'Tìm bài thảo luận...' : 'Nhập tên loài lan...'}
              aria-label={path === '/discussion' ? 'Từ khóa tìm kiếm bài thảo luận' : 'Từ khóa tìm kiếm loài lan'}
            />
            <button type="submit" className="rounded-md bg-[#56642b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">Tìm</button>
          </form>
        )}
      </div>
    </header>
  );
}
