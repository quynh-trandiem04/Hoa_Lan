import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronRight, LogOut, MessageSquare, Search, User, X } from 'lucide-react';
import type { ArticleCategory, Category } from '../types';
import { getArticleCategories, getCategories, getDiscussionById, getDiscussions } from '../services/api';

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

const readCurrentUserName = (): string => {
  const readJson = (key: string): Record<string, unknown> | null => {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
    } catch {
      return null;
    }
  };

  const profile = readJson('orchidee_user');
  const auth = readJson('orchidee_auth');
  const candidates = [profile?.fullName, profile?.name, auth?.fullName, auth?.name, profile?.email, auth?.email];
  const storedEmail = localStorage.getItem('orchidee_admin_user') || sessionStorage.getItem('orchidee_admin_user');
  if (storedEmail) candidates.push(storedEmail);
  const displayName = candidates.find((value) => typeof value === 'string' && value.trim());
  return typeof displayName === 'string' ? displayName.trim() : 'Tài khoản';
};

interface StoredUserIdentity {
  id: string;
  name: string;
}

interface CommentNotification {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  content: string;
  createdAt: string;
}

const readCurrentUserIdentity = (): StoredUserIdentity | null => {
  const rawProfile = localStorage.getItem('orchidee_user') || sessionStorage.getItem('orchidee_user');
  if (rawProfile) {
    try {
      const profile = JSON.parse(rawProfile) as { id?: unknown; fullName?: unknown; name?: unknown };
      const id = typeof profile.id === 'string' ? profile.id : '';
      const nameValue = typeof profile.fullName === 'string' ? profile.fullName : profile.name;
      const name = typeof nameValue === 'string' ? nameValue.trim() : readCurrentUserName();
      if (id || name) return { id, name };
    } catch {
      // Fall back to the stored account name below.
    }
  }
  const name = readCurrentUserName();
  return name !== 'Tài khoản' ? { id: '', name } : null;
};

const notificationReadKey = (identity: StoredUserIdentity | null) =>
  `orchidee_read_comment_notifications_${identity?.id || identity?.name || 'guest'}`;

const readNotificationIds = (identity: StoredUserIdentity | null): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(notificationReadKey(identity)) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const formatNotificationTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (elapsedMinutes < 1) return 'Vừa xong';
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút trước`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)} giờ trước`;
  return new Date(value).toLocaleDateString('vi-VN');
};

type MenuCategory = Pick<Category, 'id' | 'name' | 'parentId'> | Pick<ArticleCategory, 'id' | 'name' | 'parentId'>;

const CascadingMenuDropdown = ({ categories, rootNames, basePath }: { categories: MenuCategory[], rootNames?: string[], basePath: string }) => {
  const root = useMemo(
    () => rootNames?.length
      ? categories.find((category) => rootNames.some((name) => category.name.toLowerCase() === name.toLowerCase()) && !category.parentId)
      : undefined,
    [categories, rootNames],
  );
  const level1Cats = useMemo(
    () => root
      ? categories.filter((category) => category.parentId === root.id)
      : categories.filter((category) => !category.parentId),
    [categories, root],
  );
  
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
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  const [cultivationCategories, setCultivationCategories] = useState<ArticleCategory[]>([]);
  const [applicationCategories, setApplicationCategories] = useState<ArticleCategory[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(readFavoriteCount);
  const [currentUserName, setCurrentUserName] = useState(readCurrentUserName);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [commentNotifications, setCommentNotifications] = useState<CommentNotification[]>([]);
  const [readCommentNotificationIds, setReadCommentNotificationIds] = useState(() => readNotificationIds(readCurrentUserIdentity()));
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuOpenRef = useRef(false);
  const profileCloseTimerRef = useRef<number | null>(null);
  const path = window.location.pathname;

  useEffect(() => {
    if (suppliedCategories) return;
    let active = true;
    void getCategories({ pageNumber: 1, pageSize: 100 })
      .then((result) => { if (active) setLoadedCategories(result.items); })
      .catch(() => { if (active) setLoadedCategories([]); });
    return () => { active = false; };
  }, [suppliedCategories]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getArticleCategories('cultivation', { pageNumber: 1, pageSize: 100, sortBy: 'name' }),
      getArticleCategories('application', { pageNumber: 1, pageSize: 100, sortBy: 'name' }),
    ]).then(([cultivation, application]) => {
      if (!active) return;
      setCultivationCategories(cultivation);
      setApplicationCategories(application);
    }).catch(() => {
      if (!active) return;
      setCultivationCategories([]);
      setApplicationCategories([]);
    });
    return () => { active = false; };
  }, []);

  const loadCommentNotifications = useCallback(async () => {
    const hasToken = Boolean(localStorage.getItem('orchidee_auth_token') || sessionStorage.getItem('orchidee_auth_token'));
    const identity = readCurrentUserIdentity();
    if (!hasToken || !identity) {
      setCommentNotifications([]);
      return;
    }

    setLoadingNotifications(true);
    try {
      const result = await getDiscussions({ pageNumber: 1, pageSize: 100 });
      const ownedPosts = (result.items ?? []).filter((post) =>
        (identity.id && post.authorId === identity.id)
        || (!identity.id && post.authorName?.trim().toLocaleLowerCase('vi') === identity.name.toLocaleLowerCase('vi')),
      );
      const hydratedPosts = await Promise.all(ownedPosts.map(async (post) => {
        const comments = Array.isArray(post.comments) ? post.comments : [];
        if (comments.length >= (post.commentCount ?? comments.length)) return post;
        try {
          return await getDiscussionById(post.id);
        } catch {
          return post;
        }
      }));
      const nextNotifications = hydratedPosts.flatMap((post) => (post.comments ?? [])
        .filter((comment) => {
          const isCurrentUserById = Boolean(identity.id && comment.authorId === identity.id);
          const isCurrentUserByName = !identity.id
            && comment.authorName?.trim().toLocaleLowerCase('vi') === identity.name.toLocaleLowerCase('vi');
          return !isCurrentUserById && !isCurrentUserByName;
        })
        .map((comment) => ({
          id: comment.id,
          postId: post.id,
          postTitle: post.title || 'Bài thảo luận của bạn',
          authorName: comment.authorName || 'Một thành viên',
          content: comment.content || '',
          createdAt: comment.createdAt,
        })))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCommentNotifications(nextNotifications);
      if (notificationMenuOpenRef.current) {
        const notificationIds = nextNotifications.map((notification) => notification.id);
        setReadCommentNotificationIds(notificationIds);
        localStorage.setItem(notificationReadKey(identity), JSON.stringify(notificationIds));
      }
    } catch (error) {
      console.error('Không thể tải thông báo bình luận:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadCommentNotifications(), 0);
    const interval = window.setInterval(() => void loadCommentNotifications(), 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadCommentNotifications]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        notificationMenuOpenRef.current = false;
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeProfileMenu);
    return () => document.removeEventListener('mousedown', closeProfileMenu);
  }, []);

  useEffect(() => {
    const refreshAccountSummary = () => {
      setFavoriteCount(readFavoriteCount());
      setCurrentUserName(readCurrentUserName());
      setReadCommentNotificationIds(readNotificationIds(readCurrentUserIdentity()));
      void loadCommentNotifications();
    };
    window.addEventListener('storage', refreshAccountSummary);
    window.addEventListener('orchidee-favorites-updated', refreshAccountSummary);
    window.addEventListener('orchidee-profile-updated', refreshAccountSummary);
    return () => {
      window.removeEventListener('storage', refreshAccountSummary);
      window.removeEventListener('orchidee-favorites-updated', refreshAccountSummary);
      window.removeEventListener('orchidee-profile-updated', refreshAccountSummary);
    };
  }, [loadCommentNotifications]);

  const openProfileMenu = () => {
    if (profileCloseTimerRef.current) window.clearTimeout(profileCloseTimerRef.current);
    setFavoriteCount(readFavoriteCount());
    setCurrentUserName(readCurrentUserName());
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

  const toggleNotificationMenu = () => {
    const willOpen = !notificationMenuOpen;
    notificationMenuOpenRef.current = willOpen;
    setNotificationMenuOpen(willOpen);
    setProfileMenuOpen(false);
    if (!willOpen) return;
    const identity = readCurrentUserIdentity();
    const notificationIds = commentNotifications.map((notification) => notification.id);
    setReadCommentNotificationIds(notificationIds);
    localStorage.setItem(notificationReadKey(identity), JSON.stringify(notificationIds));
    void loadCommentNotifications();
  };

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
  const unreadNotificationCount = commentNotifications.filter((notification) => !readCommentNotificationIds.includes(notification.id)).length;
  const orchidCategories = suppliedCategories ?? loadedCategories;

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#56642b]/10 bg-surface-cream/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-16">
        <a href="/" className="select-none font-serif text-xl font-bold italic tracking-tight text-botanical-green md:text-2xl">Orchids</a>

        <nav className="hidden h-full items-center space-x-4 md:flex">
          <a href="/" className={`font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${path === '/' ? activeClass : normalClass}`}>Trang chủ</a>

          <div className="group relative flex h-full items-center">
            <a href="/list-orchids" className={`flex cursor-pointer items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${isCatalog ? activeClass : normalClass}`}>
              Danh mục lan <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </a>
            <CascadingMenuDropdown categories={orchidCategories} rootNames={['Danh mục lan']} basePath="/list-orchids" />
          </div>

          <div className="group relative flex h-full items-center">
            <a href="/planting-and-care" className={`flex cursor-pointer items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${path === '/planting-and-care' ? activeClass : normalClass}`}>
              Cách trồng và chăm sóc <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </a>
            <CascadingMenuDropdown categories={cultivationCategories} basePath="/planting-and-care" />
          </div>

          <div className="group relative flex h-full items-center">
            <a href="/applications" className={`flex cursor-pointer items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${path === '/applications' ? activeClass : normalClass}`}>
              Ứng dụng <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </a>
            <CascadingMenuDropdown categories={applicationCategories} basePath="/applications" />
          </div>
          <a href="/document" className={`font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${path === '/document' ? activeClass : normalClass}`}>Tài liệu</a>
          <a href="/discussion" className={`font-sans text-[11px] font-semibold uppercase tracking-wide transition-colors ${path === '/discussion' ? activeClass : normalClass}`}>Thảo luận</a>
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
          {isAuthenticated && (
            <div ref={notificationMenuRef} className="relative flex h-full items-center">
              <button
                type="button"
                onClick={toggleNotificationMenu}
                className={`relative rounded-full p-1.5 text-botanical-green transition-colors hover:bg-[#56642b]/5 ${notificationMenuOpen ? 'bg-[#56642b]/10' : ''}`}
                aria-label="Mở thông báo bình luận"
                aria-expanded={notificationMenuOpen}
                aria-haspopup="menu"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationMenuOpen && (
                <div className="absolute right-0 top-[calc(100%-7px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#747878]/10 bg-white shadow-xl" role="menu">
                  <div className="flex items-center justify-between border-b border-[#eeeeea] px-5 py-3">
                    <div>
                      <p className="font-serif text-base font-bold text-[#1a1c1b]">Thông báo</p>
                      <p className="mt-0.5 text-[10px] text-[#747878]">Bình luận mới trên bài viết của bạn</p>
                    </div>
                    {unreadNotificationCount > 0 && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">{unreadNotificationCount} mới</span>}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications && commentNotifications.length === 0 ? (
                      <p className="px-5 py-8 text-center text-xs text-[#747878]">Đang tải thông báo...</p>
                    ) : commentNotifications.length === 0 ? (
                      <div className="px-5 py-10 text-center text-[#747878]">
                        <Bell className="mx-auto mb-2 h-7 w-7 opacity-40" />
                        <p className="text-xs">Chưa có bình luận mới.</p>
                      </div>
                    ) : commentNotifications.map((notification) => (
                      <a
                        key={notification.id}
                        href={`/discussion?postId=${encodeURIComponent(notification.postId)}&commentId=${encodeURIComponent(notification.id)}`}
                        className="flex gap-3 border-b border-[#eeeeea] px-4 py-3 transition-colors last:border-0 hover:bg-[#56642b]/5"
                        role="menuitem"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8edda] text-[#56642b]">
                          <MessageSquare size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-5 text-[#343837]"><strong>{notification.authorName}</strong> đã bình luận về “{notification.postTitle}”.</p>
                          {notification.content && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#747878]">{notification.content}</p>}
                          <time className="mt-1 block text-[10px] font-medium text-[#56642b]">{formatNotificationTime(notification.createdAt)}</time>
                        </div>
                      </a>
                    ))}
                  </div>
                  <a href="/discussion" className="block border-t border-[#eeeeea] px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#56642b] hover:bg-[#56642b]/5">Xem trang thảo luận</a>
                </div>
              )}
            </div>
          )}
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
              className={`flex min-w-0 items-center gap-2 rounded-full p-1.5 text-botanical-green transition-colors hover:bg-[#56642b]/5 ${profileMenuOpen ? 'bg-[#56642b]/10' : ''}`}
              aria-label={isAuthenticated ? 'Mở menu tài khoản' : 'Mở menu đăng nhập'}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <User className="h-5 w-5 shrink-0" />
              {isAuthenticated && (
                <span className="max-w-28 truncate font-sans text-[11px] font-semibold text-[#434748]" title={currentUserName}>
                  {currentUserName}
                </span>
              )}
              {isAuthenticated && favoriteCount > 0 && (
                <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#56642b] px-1 text-[9px] font-bold leading-none text-white">
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
                      <p className="mt-1 truncate font-serif text-sm font-semibold text-[#1a1c1b]" title={currentUserName}>{currentUserName}</p>
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
