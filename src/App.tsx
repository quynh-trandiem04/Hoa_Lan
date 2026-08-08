/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CustomerHome from './pages/CustomerHome';
import Discussion from './pages/Discussion';
import PlantingAndCare from './pages/PlantingAndCare';
import Applications from './pages/Applications';
import DocumentPage from './pages/Document';
import GlobalSearch from './pages/GlobalSearch';
import {
  LayoutDashboard,
  FolderKanban,
  FolderPlus,
  BookOpen,
  Users,
  LogOut,
  Menu,
  Search,
  Plus,
  FilePlus,
  ChevronRight,
  Sparkles,
  UserPlus,
  Edit,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  Layers,
  FileText,
  Image as ImageIcon,
  Upload,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  Grid2X2,
  List,
  Flower2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Domain Imports
import { Orchid, Question, Category, CommunityPost, CareArticle, PaginatedDocuments, DocumentItem, Region, BloomSeason, FlowerColor, type ArticleCategory, type DocumentCategory } from './types';
import { login, register, loginWithGoogle, refreshStoredAuthSession, getCategories, createCategory, getCategoryById, updateCategory, deleteCategory, getArticleById, getSectionArticles, createSectionArticle, updateSectionArticle, deleteSectionArticle, getArticleCategories, getOrchids, getOrchidById, createOrchid, updateOrchid, deleteOrchid, getDocuments, createDocument, updateDocument, deleteDocument, getDocumentCategories, createDocumentCategory, updateDocumentCategory, deleteDocumentCategory, uploadImage, getUploadedImageUrl, getUsers, createUser, updateUser, deleteUser, resetUserPassword, getDiscussions, type ArticleSection, type DiscussionPostDto, type LoginResponse, type UserListItem } from './services/api';
import { getOrchidImageUrls } from './utils/orchidImages';
import {
  INITIAL_QUESTIONS,
  INITIAL_COMMUNITY_POSTS
} from './data';

// Subcomponent Imports
import { Toasts, useToasts } from './components/Toasts';
import { ReportModal } from './components/ReportModal';
import { DocUploadModal } from './components/DocUploadModal';
import { InviteAdminModal, type UserFormValues } from './components/InviteAdminModal';
import { ReplyModal } from './components/ReplyModal';
import { AddOrchidModal, AddCategoryModal } from './components/OrchidForms';
import { ModerationModal } from './components/ModerationModal';
import ListOrchids from './pages/ListOrchids';
import OrchidDetail from './pages/OrchidDetail';
import CustomerProfile from './pages/CustomerProfile';
import GoogleLoginButton from './components/GoogleLoginButton';
import ArticleCategoryManager from './components/ArticleCategoryManager';
import CategoryTreeSelect from './components/CategoryTreeSelect';
import AdminDashboardOverview from './components/AdminDashboardOverview';
import LocalRichTextEditor from './components/LocalRichTextEditor';
import DocumentCategoryManager, { type DocumentCategoryValues } from './components/DocumentCategoryManager';
import InlineCategoryTreePicker from './components/InlineCategoryTreePicker';
import AdminDiscussionManager from './components/AdminDiscussionManager';
import AdminPagination from './components/AdminPagination';
import { useConfirmDialog } from './components/ConfirmDialog';

const ORCHID_FEATURE_FILTERS = [
  { id: 'Popular', name: 'Lan phổ biến', parentId: null },
  { id: 'Fragrant', name: 'Có hương thơm', parentId: null },
];

const ORCHID_SORT_OPTIONS = [
  { id: 'az', name: 'Tên A–Z', parentId: null },
  { id: 'za', name: 'Tên Z–A', parentId: null },
];

const ORCHID_COLOR_LABELS: Record<string, string> = {
  RED: 'Đỏ', ORANGE: 'Cam', YELLOW: 'Vàng', WHITE: 'Trắng', PINK: 'Hồng', PURPLE: 'Tím',
  GREEN: 'Xanh lá', LIGHT_GREEN: 'Xanh nhạt', BLUE: 'Xanh dương', CREAM: 'Kem', BROWN: 'Nâu', BLACK: 'Đen',
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;
    const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const payloadBytes = Uint8Array.from(atob(paddedPayload), (character) => character.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    return payload !== null && typeof payload === 'object'
      ? payload as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
};

const getEmailFromGoogleIdToken = (idToken: string): string => {
  const email = decodeJwtPayload(idToken)?.email;
  return typeof email === 'string' ? email : 'google-user';
};

const getJwtExpiration = (token: string): number | null => {
  const expiration = decodeJwtPayload(token)?.exp;
  return typeof expiration === 'number' ? expiration * 1000 : null;
};

const JWT_ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

const getJwtRoles = (token: string | null | undefined): string[] => {
  if (!token) return [];
  const claims = decodeJwtPayload(token);
  if (!claims) return [];

  return JWT_ROLE_CLAIM_KEYS.flatMap((key) => {
    const value = claims[key];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((role): role is string => typeof role === 'string');
    return [];
  }).map((role) => role.trim()).filter(Boolean);
};

const isAdminRole = (role: string): boolean => {
  const normalizedRole = role.replace(/[\s_-]+/g, '').toLowerCase();
  return normalizedRole === 'admin'
    || normalizedRole === 'administrator'
    || normalizedRole === 'systemadmin'
    || normalizedRole === 'superadmin';
};

const isAdminToken = (token: string | null | undefined): boolean =>
  getJwtRoles(token).some(isAdminRole);

const getStoredAccessToken = (): string | null =>
  localStorage.getItem('orchidee_auth_token')
  || sessionStorage.getItem('orchidee_auth_token');

const isStoredSessionAdmin = (): boolean => isAdminToken(getStoredAccessToken());

const getFirstString = (source: Record<string, unknown> | null | undefined, keys: string[]): string => {
  if (!source) return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const createSessionUserProfile = (
  authData: LoginResponse,
  accessToken: string,
  fallbackEmail: string,
  identityToken?: string,
): UserListItem | null => {
  const accessClaims = decodeJwtPayload(accessToken);
  const identityClaims = identityToken ? decodeJwtPayload(identityToken) : null;
  const id = getFirstString(authData, ['userId', 'id'])
    || getFirstString(accessClaims, [
      'nameid',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      'sub',
    ]);
  if (!id) return null;

  return {
    id,
    email: getFirstString(authData, ['email'])
      || getFirstString(accessClaims, ['email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'])
      || getFirstString(identityClaims, ['email'])
      || fallbackEmail,
    fullName: getFirstString(authData, ['fullName', 'name'])
      || getFirstString(accessClaims, ['name', 'unique_name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'])
      || getFirstString(identityClaims, ['name'])
      || fallbackEmail,
    avatarUrl: getFirstString(authData, ['avatarUrl', 'picture'])
      || getFirstString(identityClaims, ['picture']),
    roleName: getJwtRoles(accessToken)[0]
      || getFirstString(authData, ['role', 'roleName']),
  };
};

const getStoredSessionUserProfile = (): UserListItem | null => {
  const raw = localStorage.getItem('orchidee_user') || sessionStorage.getItem('orchidee_user');
  if (raw) {
    try {
      const profile = JSON.parse(raw) as UserListItem;
      if (profile?.id && profile?.email) return profile;
    } catch {
      // Fall through and reconstruct the profile from the saved auth session.
    }
  }

  const storage = localStorage.getItem('orchidee_auth') ? localStorage : sessionStorage;
  const rawAuth = storage.getItem('orchidee_auth');
  const token = storage.getItem('orchidee_auth_token');
  if (!rawAuth || !token) return null;
  const email = storage.getItem('orchidee_admin_user')
    || getFirstString(decodeJwtPayload(token), [
      'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    ]);
  try {
    const profile = createSessionUserProfile(JSON.parse(rawAuth) as LoginResponse, token, email);
    if (profile) storage.setItem('orchidee_user', JSON.stringify(profile));
    return profile;
  } catch {
    return null;
  }
};

const _formatRelativeTime = (value: string): string => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return value;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'Vừa xong';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} phút trước`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} giờ trước`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} ngày trước`;
  return new Date(value).toLocaleDateString('vi-VN');
};

const createSlug = (value: string): string => value
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const SHOW_LEGACY_OVERVIEW = false;

type PostLoginScreen = 'home' | 'discussion' | 'profile' | 'planting_and_care' | 'applications' | 'document' | 'list_orchids' | 'search' | 'dashboard';

const getPostLoginScreen = (returnUrl: string | null, token: string | null | undefined): PostLoginScreen => {
  if ((returnUrl === '/admin/dashboard' || returnUrl === '/dashboard') && isAdminToken(token)) return 'dashboard';
  if (returnUrl === '/discussion') return 'discussion';
  if (returnUrl === '/profile') return 'profile';
  if (returnUrl === '/planting-and-care') return 'planting_and_care';
  if (returnUrl === '/applications') return 'applications';
  if (returnUrl === '/document') return 'document';
  if (returnUrl === '/list-orchids') return 'list_orchids';
  if (returnUrl === '/search') return 'search';
  return 'home';
};

const getRequestedReturnUrl = (): string | null => {
  const queryReturnUrl = new URLSearchParams(window.location.search).get('returnUrl');
  if (queryReturnUrl) return queryReturnUrl;
  if (window.location.pathname === '/admin/dashboard' || window.location.pathname === '/dashboard') {
    return '/admin/dashboard';
  }
  return null;
};

export default function App() {
  const { toasts, addToast, removeToast } = useToasts();
  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog();

  
  type ScreenType = "home" | "signup" | "login" | "forgot_password" | "dashboard" | "discussion" | "planting_and_care" | "applications" | "document" | "search" | "list_orchids" | "orchid_detail" | "profile";

  const getInitialScreen = (): ScreenType => {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot_password' || path === '/forgot-password') return 'forgot_password';
    if (path === '/admin/dashboard' || path === '/dashboard') {
      const storedToken = getStoredAccessToken();
      return isAdminToken(storedToken) ? 'dashboard' : (storedToken ? 'home' : 'login');
    }
    if (path === '/discussion') return 'discussion';
    if (path === '/planting-and-care') return 'planting_and_care';
    if (path === '/applications') return 'applications';
    if (path === '/document') return 'document';
    if (path === '/search') return 'search';
    if (path === '/profile') return 'profile';
    if (path === '/list-orchids') return 'list_orchids';
    if (path.startsWith('/orchids/')) return 'orchid_detail';
    return 'home';
  };

  const [screen, setScreenState] = useState<ScreenType>(getInitialScreen);
  const [selectedOrchidId, setSelectedOrchidId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/orchids/')) {
      return path.split('/')[2];
    }
    return null;
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('cat')
  );

  const setScreen = (newScreen: ScreenType, id?: string) => {
    if (newScreen === 'dashboard') {
      const storedToken = getStoredAccessToken();
      if (!isAdminToken(storedToken)) {
        const fallbackScreen: ScreenType = storedToken ? 'home' : 'login';
        setScreenState(fallbackScreen);
        window.history.pushState({}, '', storedToken ? '/' : '/login');
        return;
      }
    }

    setScreenState(newScreen);
    let path = '/';
    if (newScreen === 'login') path = '/login';
    else if (newScreen === 'signup') path = '/signup';
    else if (newScreen === 'forgot_password') path = '/forgot_password';
    else if (newScreen === 'dashboard') path = '/admin/dashboard';
    else if (newScreen === 'discussion') path = '/discussion';
    else if (newScreen === 'planting_and_care') path = '/planting-and-care';
    else if (newScreen === 'applications') path = '/applications';
    else if (newScreen === 'document') path = '/document';
    else if (newScreen === 'search') path = '/search';
    else if (newScreen === 'profile') path = '/profile';
    else if (newScreen === 'list_orchids') {
      if (id) {
        path = `/list-orchids?cat=${id}`;
        setSelectedCategoryId(id);
      } else {
        path = '/list-orchids';
        setSelectedCategoryId(null);
      }
    }
    else if (newScreen === 'orchid_detail' && id) {
      path = `/orchids/${id}`;
      setSelectedOrchidId(id);
    }
    
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextScreen = getInitialScreen();
      const storedToken = getStoredAccessToken();
      const isDashboardPath = window.location.pathname === '/admin/dashboard'
        || window.location.pathname === '/dashboard';

      if (isDashboardPath && !isAdminToken(storedToken)) {
        window.history.replaceState({}, '', storedToken ? '/' : '/login');
        setScreenState(storedToken ? "home" : "login");
        return;
      }

      setScreenState(nextScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("orchidee_remember_session") === "false") return;
    if (localStorage.getItem("orchidee_auth")) return;

    const sessionAuth = sessionStorage.getItem("orchidee_auth");
    const sessionToken = sessionStorage.getItem("orchidee_auth_token");
    if (!sessionAuth || !sessionToken) return;

    ["orchidee_admin_user", "orchidee_auth", "orchidee_auth_token", "orchidee_user"].forEach((key) => {
      const value = sessionStorage.getItem(key);
      if (value !== null) localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    });
    localStorage.setItem("orchidee_remember_session", "true");
  }, []);

  useEffect(() => {
    let isActive = true;

    const refreshStoredSession = async () => {
      const storage = localStorage.getItem("orchidee_auth")
        ? localStorage
        : sessionStorage.getItem("orchidee_auth")
          ? sessionStorage
          : null;
      if (!storage) return;

      try {
        const storedAuth = storage.getItem("orchidee_auth");
        if (!storedAuth) return;

        const session = JSON.parse(storedAuth) as LoginResponse;
        const token = session.accessToken || session.token || storage.getItem("orchidee_auth_token");
        const storedRefreshToken = session.refreshToken;
        if (!token || !storedRefreshToken) return;

        const expiresAt = getJwtExpiration(token);
        const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
        if (expiresAt !== null && expiresAt > fiveMinutesFromNow) return;

        await refreshStoredAuthSession();
        if (!isActive) return;
      } catch (error) {
        console.error("Không thể làm mới phiên đăng nhập:", error);
      }
    };

    void refreshStoredSession();
    const refreshInterval = window.setInterval(refreshStoredSession, 60 * 1000);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("orchidee_remembered_email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("orchidee_remember_session") !== "false");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [, setAuthRevision] = useState(0);

  useEffect(() => {
    localStorage.removeItem("orchidee_remembered_password");
  }, []);

  useEffect(() => {
    const handleAuthRefreshed = (event: Event) => {
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (!token) return;

      const storage = localStorage.getItem("orchidee_auth")
        ? localStorage
        : sessionStorage;
      const rawSession = storage.getItem("orchidee_auth");
      const fallbackEmail = storage.getItem("orchidee_admin_user") || "";
      if (rawSession) {
        try {
          const profile = createSessionUserProfile(
            JSON.parse(rawSession) as LoginResponse,
            token,
            fallbackEmail,
          );
          if (profile) storage.setItem("orchidee_user", JSON.stringify(profile));
        } catch {
          // Token has already been refreshed; an invalid cached profile is non-fatal.
        }
      }
      setAuthRevision((revision) => revision + 1);
    };

    const handleAuthExpired = () => {
      setCurrentUser(null);
      const isDashboardPath = window.location.pathname === '/admin/dashboard'
        || window.location.pathname === '/dashboard';
      if (isDashboardPath) {
        window.history.replaceState({}, '', '/login');
        setScreenState('login');
      }
    };

    window.addEventListener('orchidee-auth-refreshed', handleAuthRefreshed);
    window.addEventListener('orchidee-auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('orchidee-auth-refreshed', handleAuthRefreshed);
      window.removeEventListener('orchidee-auth-expired', handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("orchidee_admin_user")
      || sessionStorage.getItem("orchidee_admin_user");
    const storedToken = localStorage.getItem("orchidee_auth_token")
      || sessionStorage.getItem("orchidee_auth_token");
    if (storedUser && storedToken) {
      setCurrentUser(storedUser);
      const initialScreen = getInitialScreen();
      const isDashboardPath = window.location.pathname === '/admin/dashboard'
        || window.location.pathname === '/dashboard';
      if (isDashboardPath && !isAdminToken(storedToken)) {
        window.history.replaceState({}, '', '/');
        setScreenState('home');
        return;
      }
      if (initialScreen === "login" || initialScreen === "signup") {
        setScreen(getPostLoginScreen(getRequestedReturnUrl(), storedToken));
      }
    } else {
      localStorage.removeItem("orchidee_admin_user");
      sessionStorage.removeItem("orchidee_admin_user");
      if (getInitialScreen() === "dashboard") {
        window.history.replaceState({}, '', '/login');
        setScreenState("login");
      }
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      addToast("Vui lòng đọc và chấp thuận điều khoản dịch vụ để tiếp tục.", "error");
      return;
    }
    if (!fullName || !email || !password || !confirmPassword) {
      addToast("Xin hãy điền đầy đủ tất cả các trường thông tin.", "error");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Mật khẩu xác nhận không khớp.", "error");
      return;
    }
    setIsRegistering(true);
    try {
      const normalizedEmail = email.trim();
      await register({
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
        confirmPassword,
      });
      setEmail(normalizedEmail);
      setPassword('');
      setConfirmPassword('');
      setAgreeTerms(false);
      void loadUserCount();
      setScreen('login');
      addToast('Đăng ký tài khoản thành công. Vui lòng đăng nhập.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tạo tài khoản mới.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Hãy nhập đầy đủ Email và Mật khẩu của bạn.", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      const normalizedEmail = email.trim();
      const authData = await login({ email: normalizedEmail, password });
      const storage = rememberMe ? localStorage : sessionStorage;
      const token = authData.accessToken || authData.token;
      if (!token) {
        throw new Error('Máy chủ không trả về access token. Không thể hoàn tất đăng nhập.');
      }

      localStorage.removeItem("orchidee_admin_user");
      localStorage.removeItem("orchidee_auth");
      localStorage.removeItem("orchidee_auth_token");
      localStorage.removeItem("orchidee_user");
      sessionStorage.removeItem("orchidee_admin_user");
      sessionStorage.removeItem("orchidee_auth");
      sessionStorage.removeItem("orchidee_auth_token");
      sessionStorage.removeItem("orchidee_user");
      storage.setItem("orchidee_admin_user", normalizedEmail);
      storage.setItem("orchidee_auth", JSON.stringify(authData));

      if (rememberMe) {
        localStorage.setItem("orchidee_remember_session", "true");
        localStorage.setItem("orchidee_remembered_email", normalizedEmail);
      } else {
        localStorage.setItem("orchidee_remember_session", "false");
        localStorage.removeItem("orchidee_remembered_email");
      }
      localStorage.removeItem("orchidee_remembered_password");

      storage.setItem("orchidee_auth_token", token);
      const sessionProfile = createSessionUserProfile(authData, token, normalizedEmail);
      if (sessionProfile) storage.setItem('orchidee_user', JSON.stringify(sessionProfile));

      setCurrentUser(normalizedEmail);
      setPassword("");
      setScreen(getPostLoginScreen(getRequestedReturnUrl(), token));
      addToast("Đăng nhập thành công!", "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể kết nối đến máy chủ đăng nhập.",
        "error"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = useCallback(async (idToken: string) => {
    setIsLoggingIn(true);
    try {
      const authData = await loginWithGoogle(idToken);
      const googleEmail = getEmailFromGoogleIdToken(idToken);
      const storage = rememberMe ? localStorage : sessionStorage;
      const token = authData.accessToken || authData.token;
      if (!token) {
        throw new Error('Máy chủ không trả về access token Google.');
      }

      localStorage.removeItem("orchidee_admin_user");
      localStorage.removeItem("orchidee_auth");
      localStorage.removeItem("orchidee_auth_token");
      localStorage.removeItem("orchidee_user");
      sessionStorage.removeItem("orchidee_admin_user");
      sessionStorage.removeItem("orchidee_auth");
      sessionStorage.removeItem("orchidee_auth_token");
      sessionStorage.removeItem("orchidee_user");

      storage.setItem("orchidee_admin_user", googleEmail);
      storage.setItem("orchidee_auth", JSON.stringify(authData));
      storage.setItem("orchidee_auth_token", token);
      localStorage.setItem("orchidee_remember_session", rememberMe ? "true" : "false");
      const sessionProfile = createSessionUserProfile(authData, token, googleEmail, idToken);
      if (sessionProfile) storage.setItem('orchidee_user', JSON.stringify(sessionProfile));

      setCurrentUser(googleEmail);
      setScreen(getPostLoginScreen(getRequestedReturnUrl(), token));
      addToast("Đăng nhập Google thành công!", "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể đăng nhập bằng Google.",
        "error"
      );
    } finally {
      setIsLoggingIn(false);
    }
  }, [addToast, rememberMe]);

  const handleLogOut = () => {
    localStorage.removeItem("orchidee_admin_user");
    localStorage.removeItem("orchidee_auth");
    localStorage.removeItem("orchidee_auth_token");
    localStorage.removeItem("orchidee_user");
    sessionStorage.removeItem("orchidee_admin_user");
    sessionStorage.removeItem("orchidee_auth");
    sessionStorage.removeItem("orchidee_auth_token");
    sessionStorage.removeItem("orchidee_user");

    try {
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch (error) {
      console.warn("Không thể tắt tự động chọn tài khoản Google:", error);
    }

    setCurrentUser(null);
    setEmail("");
    setPassword("");
    window.location.replace('/login');
  };

  const BG_IMAGE_URL = "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1200";

  // --- Persistent Storage State ---
  const [orchids, setOrchids] = useState<Orchid[]>([]);
  const [publicOrchidRevision, setPublicOrchidRevision] = useState(0);
  const [, setLoadingOrchids] = useState(false);

  const loadOrchids = async () => {
    setLoadingOrchids(true);
    try {
      const data = await getOrchids();
      setOrchids((current) => data.map((orchid) => {
        const previous = current.find((item) =>
          (orchid.id && item.id === orchid.id) ||
          (orchid.slug && item.slug === orchid.slug)
        );
        return getOrchidImageUrls(orchid).length === 0 && previous
          ? { ...orchid, imageUrls: getOrchidImageUrls(previous) }
          : orchid;
      }));
    } catch (error) {
      console.error('Lỗi tải danh sách hoa lan:', error);
    } finally {
      setLoadingOrchids(false);
    }
  };

  useEffect(() => {
    loadOrchids();
  }, []);

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('ol_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [documentsData, setDocumentsData] = useState<PaginatedDocuments | null>(null);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSortOrder, setUserSortOrder] = useState('az');
  const [userViewMode, setUserViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [docPage, setDocPage] = useState(1);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [loadingDocumentCategories, setLoadingDocumentCategories] = useState(false);
  const [documentForm, setDocumentForm] = useState<Omit<DocumentItem, 'id' | 'createdAt'>>({
    title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '', categoryId: null
  });

  const loadDocuments = async (page: number) => {
    setLoadingDocuments(true);
    try {
      const data = await getDocuments(page, 10);
      setDocumentsData(data);
    } catch (error) {
      console.error('Lỗi tải danh sách tài liệu:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDocumentCategories = async () => {
    setLoadingDocumentCategories(true);
    try {
      const data = await getDocumentCategories({
        pageNumber: 1,
        pageSize: 100,
        sortBy: 'name',
        sortDescending: false,
      });
      setDocumentCategories(data.items);
    } catch (error) {
      console.error('Lỗi tải danh mục tài liệu:', error);
      addToast(error instanceof Error ? error.message : 'Không thể tải danh mục tài liệu.', 'error');
    } finally {
      setLoadingDocumentCategories(false);
    }
  };

  const loadUserCount = async (searchTerm = '', sortOrder = 'az') => {
    setLoadingUsers(true);
    try {
      const data = await getUsers(1, 100, searchTerm || undefined, 'fullName', sortOrder === 'za');
      setUserTotalCount(data.totalCount ?? data.items?.length ?? 0);
      setUsers(data.items ?? []);
    } catch (error) {
      console.error('Lỗi tải tổng số người dùng:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'orchids' | 'articles' | 'document_categories' | 'users' | 'community' | 'care' | 'cultivation_cats' | 'application_cats' | 'applications'>('overview');
  const adminPageSize = 8;
  const [categoryPage, setCategoryPage] = useState(1);
  const [orchidPage, setOrchidPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [careArticlePage, setCareArticlePage] = useState(1);
  const [expandedAdminMenus, setExpandedAdminMenus] = useState({
    orchids: false,
    applications: false,
    cultivation: false,
    documents: false,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleAdminMenu = (menu: keyof typeof expandedAdminMenus) => {
    setExpandedAdminMenus((current) => ({ ...current, [menu]: !current[menu] }));
  };
  const handleAdminMenuClick = (menu: keyof typeof expandedAdminMenus) => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setExpandedAdminMenus((current) => ({ ...current, [menu]: true }));
      return;
    }
    toggleAdminMenu(menu);
  };
  const [, setDashboardDiscussions] = useState<DiscussionPostDto[]>([]);
  const [, setLoadingDashboardDiscussions] = useState(false);

  const loadDashboardDiscussions = useCallback(async () => {
    setLoadingDashboardDiscussions(true);
    try {
      const result = await getDiscussions({ pageNumber: 1, pageSize: 20 });
      setDashboardDiscussions(result.items ?? []);
    } catch (error) {
      console.error('Không thể tải danh sách thảo luận:', error);
      setDashboardDiscussions([]);
    } finally {
      setLoadingDashboardDiscussions(false);
    }
  }, []);

  useEffect(() => {
    if (screen === 'dashboard' && activeTab === 'overview') {
      void loadDashboardDiscussions();
    }
  }, [screen, activeTab, loadDashboardDiscussions]);
  useEffect(() => {
    if (activeTab === 'articles') {
      loadDocuments(docPage);
    }
  }, [activeTab, docPage]);

  useEffect(() => {
    void loadDocuments(1);
    void loadDocumentCategories();
  }, []);

  useEffect(() => {
    if (screen === 'dashboard' && currentUser) {
      void loadUserCount();
    }
  }, [screen, currentUser]);

  // Categories are server-owned. Starting empty prevents stale demo/localStorage
  // entries from appearing while the API request is still in flight.
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let isActive = true;
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await getCategories({
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'name',
          sortDescending: false,
        });
        if (isActive) setCategories(data.items);
      } catch (error) {
        console.error('Lỗi tải danh sách danh mục:', error);
        if (isActive) addToast('Không thể tải danh mục từ máy chủ.', 'error');
      } finally {
        if (isActive) setLoadingCategories(false);
      }
    };

    void loadCategories();
    return () => {
      isActive = false;
    };
  }, [addToast]);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('ol_community_posts');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  // Reports state removed, we now use communityPosts for post moderation

  // System Notifications state
  const [, setNotifications] = useState([
    { id: 'n-1', text: 'Minh Anh gửi câu hỏi Cattleya', time: '10 phút trước', read: false },
    { id: 'n-2', text: '5 tài liệu khoa học cần được duyệt lưu trữ', time: '1 giờ trước', read: false },
    { id: 'n-3', text: 'Báo cáo xu hướng thị trường 2026 sẵn sàng', time: '1 ngày trước', read: true }
  ]);

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem('ol_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('ol_community_posts', JSON.stringify(communityPosts));
    } catch (e) {
      console.warn('Lỗi lưu trữ bài viết (có thể do ảnh quá lớn):', e);
    }
  }, [communityPosts]);

  // ol_reports effect removed

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [adminSearchResults, setAdminSearchResults] = useState<{
    orchids: Orchid[];
    documents: DocumentItem[];
    cultivation: CareArticle[];
    applications: CareArticle[];
    users: UserListItem[];
  }>({ orchids: [], documents: [], cultivation: [], applications: [], users: [] });
  const [loadingAdminSearch, setLoadingAdminSearch] = useState(false);

  useEffect(() => {
    if (screen !== 'dashboard') return;
    const query = searchQuery.trim();
    if (!query) {
      setAdminSearchResults({ orchids: [], documents: [], cultivation: [], applications: [], users: [] });
      setLoadingAdminSearch(false);
      return;
    }

    let active = true;
    setLoadingAdminSearch(true);
    const timer = window.setTimeout(() => {
      void Promise.allSettled([
        getOrchids({ pageNumber: 1, pageSize: 6, searchTerm: query }),
        getDocuments(1, 6, query),
        getSectionArticles('cultivation', { pageNumber: 1, pageSize: 6, searchTerm: query }),
        getSectionArticles('application', { pageNumber: 1, pageSize: 6, searchTerm: query }),
        getUsers(1, 6, query),
      ]).then(([orchidResult, documentResult, cultivationResult, applicationResult, userResult]) => {
        if (!active) return;
        setAdminSearchResults({
          orchids: orchidResult.status === 'fulfilled' ? orchidResult.value : [],
          documents: documentResult.status === 'fulfilled' ? documentResult.value.items ?? [] : [],
          cultivation: cultivationResult.status === 'fulfilled' ? cultivationResult.value : [],
          applications: applicationResult.status === 'fulfilled' ? applicationResult.value : [],
          users: userResult.status === 'fulfilled' ? userResult.value.items ?? [] : [],
        });
      }).finally(() => {
        if (active) setLoadingAdminSearch(false);
      });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [screen, searchQuery]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = window.setTimeout(() => {
      void loadUserCount(searchQuery.trim(), userSortOrder);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [activeTab, searchQuery, userSortOrder]);

  // --- Modals State ---
  const [openAddOrchid, setOpenAddOrchid] = useState(false);
  const [editingOrchid, setEditingOrchid] = useState<Orchid | null>(null);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [openDocUpload, setOpenDocUpload] = useState(false);
  const [openInviteAdmin, setOpenInviteAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [replyTargetQuestion, setReplyTargetQuestion] = useState<Question | null>(null);

  // old articles state removed

  // --- Care Guide state (API) ---
  const [careArticles, setCareArticles] = useState<CareArticle[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<ArticleSection, number>>({
    cultivation: 0,
    application: 0,
  });
  const [cultivationCategories, setCultivationCategories] = useState<ArticleCategory[]>([]);
  const [applicationCategories, setApplicationCategories] = useState<ArticleCategory[]>([]);
  const [loadingArticleCategories, setLoadingArticleCategories] = useState<Record<ArticleSection, boolean>>({
    cultivation: false,
    application: false,
  });
  const [careDocumentOptions, setCareDocumentOptions] = useState<DocumentItem[]>([]);
  const [loadingCareArticles, setLoadingCareArticles] = useState(false);
  const [showCareArticleEditor, setShowCareArticleEditor] = useState(false);
  const [editingCareArticle, setEditingCareArticle] = useState<CareArticle | null>(null);
  const emptyCareArticleForm = {
    title: '',
    slug: '',
    summary: '',
    content: '',
    thumbnailImageId: '',
    isPublished: true,
    orchidIds: [] as string[],
    documentIds: [] as string[],
    categoryId: '',
  };
  const [careArticleForm, setCareArticleForm] = useState(emptyCareArticleForm);
  const [savingCareArticle, setSavingCareArticle] = useState(false);
  const [uploadingCareThumbnail, setUploadingCareThumbnail] = useState(false);
  const [careThumbnailPreviewUrl, setCareThumbnailPreviewUrl] = useState('');

  const currentArticleSection: ArticleSection = activeTab === 'applications' ? 'application' : 'cultivation';
  const currentArticleCategories = currentArticleSection === 'application'
    ? applicationCategories
    : cultivationCategories;

  const loadArticleCategories = useCallback(async (section: ArticleSection) => {
    setLoadingArticleCategories((current) => ({ ...current, [section]: true }));
    try {
      const data = await getArticleCategories(section, { pageNumber: 1, pageSize: 100, sortBy: 'name' });
      if (section === 'application') setApplicationCategories(data);
      else setCultivationCategories(data);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải danh mục bài viết.', 'error');
    } finally {
      setLoadingArticleCategories((current) => ({ ...current, [section]: false }));
    }
  }, [addToast]);

  useEffect(() => {
    if (screen !== 'dashboard') return;
    void loadArticleCategories('cultivation');
    void loadArticleCategories('application');
    void Promise.all([
      getSectionArticles('cultivation', { pageNumber: 1, pageSize: 100 }),
      getSectionArticles('application', { pageNumber: 1, pageSize: 100 }),
    ]).then(([cultivationArticles, applicationArticles]) => {
      setArticleCounts({
        cultivation: cultivationArticles.length,
        application: applicationArticles.length,
      });
    }).catch((error) => {
      console.error('Không thể tải số lượng bài viết theo nhóm:', error);
    });
  }, [screen, loadArticleCategories]);

  useEffect(() => {
    if (activeTab === 'care' || activeTab === 'applications') {
      const section: ArticleSection = activeTab === 'applications' ? 'application' : 'cultivation';
      setShowCareArticleEditor(false);
      setEditingCareArticle(null);
      void loadCareArticles(section);
      void loadArticleCategories(section);
      void loadCareDocumentOptions();
    } else if (activeTab === 'cultivation_cats') {
      void loadArticleCategories('cultivation');
    } else if (activeTab === 'application_cats') {
      void loadArticleCategories('application');
    }
  }, [activeTab, loadArticleCategories]);

  const loadCareArticles = async (section: ArticleSection = currentArticleSection) => {
    setLoadingCareArticles(true);
    try {
      const data = await getSectionArticles(section, { pageNumber: 1, pageSize: 100 });
      setCareArticles(data);
      setArticleCounts((current) => ({ ...current, [section]: data.length }));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải danh sách bài viết.', 'error');
    } finally {
      setLoadingCareArticles(false);
    }
  };

  const handleSaveCareArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careArticleForm.title.trim() || !careArticleForm.content.trim()) {
      addToast('Vui lòng nhập đủ thông tin', 'error');
      return;
    }
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (careArticleForm.thumbnailImageId && !uuidPattern.test(careArticleForm.thumbnailImageId.trim())) {
      addToast('ID ảnh đại diện phải là UUID hợp lệ.', 'error');
      return;
    }
    if (careArticleForm.documentIds.some((id) => !uuidPattern.test(id))) {
      addToast('Danh sách tài liệu chứa UUID không hợp lệ.', 'error');
      return;
    }

    const slug = careArticleForm.slug.trim() || careArticleForm.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const payload = {
      ...careArticleForm,
      title: careArticleForm.title.trim(),
      slug,
      summary: careArticleForm.summary.trim(),
      content: careArticleForm.content.trim(),
      thumbnailImageId: careArticleForm.thumbnailImageId.trim() || null,
    };
    const { categoryId, ...sectionArticlePayload } = payload;

    setSavingCareArticle(true);
    try {
      if (editingCareArticle && editingCareArticle.id) {
        await updateSectionArticle(currentArticleSection, editingCareArticle.id, {
          ...sectionArticlePayload,
          articleCategoryIds: categoryId ? [categoryId] : [],
        });
        addToast('Cập nhật thành công', 'success');
      } else {
        await createSectionArticle(currentArticleSection, {
          ...sectionArticlePayload,
          articleCategoryIds: categoryId ? [categoryId] : [],
        });
        addToast('Thêm mới thành công', 'success');
      }
      setShowCareArticleEditor(false);
      setEditingCareArticle(null);
      setCareArticleForm(emptyCareArticleForm);
      setCareThumbnailPreviewUrl('');
      await loadCareArticles(currentArticleSection);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu.', 'error');
    } finally {
      setSavingCareArticle(false);
    }
  };

  const handleUploadCareThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Vui lòng chọn đúng tệp hình ảnh.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('Ảnh đại diện không được vượt quá 10 MB.', 'error');
      return;
    }

    setUploadingCareThumbnail(true);
    try {
      const uploaded = await uploadImage(file);
      setCareArticleForm((current) => ({ ...current, thumbnailImageId: uploaded.id }));
      setCareThumbnailPreviewUrl(uploaded.url);
      addToast('Tải ảnh đại diện thành công.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải ảnh đại diện.', 'error');
    } finally {
      setUploadingCareThumbnail(false);
    }
  };

  const loadCareDocumentOptions = async () => {
    try {
      const data = await getDocuments(1, 100);
      setCareDocumentOptions(data.items);
    } catch (error) {
      console.error('Không thể tải tài liệu liên quan:', error);
      setCareDocumentOptions([]);
    }
  };

  const handleOpenEditCareArticle = async (id: string) => {
    try {
      const article = await getArticleById(id);
      setEditingCareArticle(article);
      setCareArticleForm({
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        thumbnailImageId: article.thumbnailImageId ?? '',
        isPublished: article.isPublished,
        orchidIds: article.orchidIds,
        documentIds: article.documentIds,
        categoryId: article.articleCategoryIds?.[0] ?? article.categories?.[0]?.id ?? article.categoryId ?? '',
      });
      setCareThumbnailPreviewUrl(article.thumbnailImageUrl || getUploadedImageUrl(article.thumbnailImageId));
      setShowCareArticleEditor(true);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông tin bài viết.', 'error');
    }
  };

  const handleDeleteCareArticle = async (id: string) => {
    const articleLabel = currentArticleSection === 'application' ? 'bài ứng dụng' : 'bài hướng dẫn';
    if (!(await confirmDelete({
      title: `Xóa ${articleLabel}?`,
      message: 'Bài viết sẽ bị xóa khỏi website và không thể khôi phục.',
    }))) return;
    try {
      await deleteSectionArticle(currentArticleSection, id);
      addToast('Xóa thành công', 'info');
      void loadCareArticles(currentArticleSection);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa.', 'error');
    }
  };

  // --- Community state ---
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // --- Moderation Modal state ---
  const [openModerationModal, setOpenModerationModal] = useState(false);
  const [selectedPendingPost] = useState<CommunityPost | null>(null);

  // --- Toast notifications mechanism ---
  // --- Orchid Tab Search & Filter States ---
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedFeatureFilters, setSelectedFeatureFilters] = useState<string[]>([]);
  const [selectedRegionFilters, setSelectedRegionFilters] = useState<string[]>([]);
  const [selectedSeasonFilters, setSelectedSeasonFilters] = useState<string[]>([]);
  const [selectedColorFilters, setSelectedColorFilters] = useState<string[]>([]);
  const [orchidSortOrder, setOrchidSortOrder] = useState('az');
  const [orchidAdminViewMode, setOrchidAdminViewMode] = useState<'grid' | 'list'>('grid');
  const [showOrchidAdvancedFilters, setShowOrchidAdvancedFilters] = useState(false);
  const [adminOrchids, setAdminOrchids] = useState<Orchid[]>([]);
  const [loadingAdminOrchids, setLoadingAdminOrchids] = useState(false);
  const [adminOrchidError, setAdminOrchidError] = useState('');
  const orchidFilterCategories = useMemo(() => {
    const catalogRoot = categories.find((category) => !category.parentId && category.name.toLocaleLowerCase('vi') === 'danh mục lan');
    return catalogRoot ? categories.filter((category) => category.id !== catalogRoot.id) : categories;
  }, [categories]);

  useEffect(() => {
    if (activeTab !== 'orchids') return;

    const categoryIds = new Set<string>();
    if (selectedCategoryFilter) {
      categoryIds.add(selectedCategoryFilter);
      let foundDescendant = true;
      while (foundDescendant) {
        foundDescendant = false;
        categories.forEach((category) => {
          if (category.parentId && categoryIds.has(category.parentId) && !categoryIds.has(category.id)) {
            categoryIds.add(category.id);
            foundDescendant = true;
          }
        });
      }
    }

    let active = true;
    setLoadingAdminOrchids(true);
    setAdminOrchidError('');
    const timer = window.setTimeout(() => {
      void getOrchids({
        pageNumber: 1,
        pageSize: 100,
        searchTerm: searchQuery.trim() || undefined,
        categoryIds: [...categoryIds],
        isPopular: selectedFeatureFilters.includes('Popular') ? true : undefined,
        hasFragrance: selectedFeatureFilters.includes('Fragrant') ? true : undefined,
        regions: selectedRegionFilters,
        bloomSeasons: selectedSeasonFilters,
        colors: selectedColorFilters,
        sortBy: 'name',
        sortDescending: orchidSortOrder === 'za',
      })
        .then((items) => {
          if (!active) return;
          setAdminOrchids(items.map((orchid) => {
            const previous = orchids.find((item) => item.id === orchid.id || (orchid.slug && item.slug === orchid.slug));
            return getOrchidImageUrls(orchid).length === 0 && previous
              ? { ...orchid, imageUrls: getOrchidImageUrls(previous) }
              : orchid;
          }));
        })
        .catch((error) => {
          if (!active) return;
          setAdminOrchidError(error instanceof Error ? error.message : 'Không thể tìm kiếm hoa lan từ API.');
          setAdminOrchids([]);
        })
        .finally(() => {
          if (active) setLoadingAdminOrchids(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeTab, searchQuery, selectedCategoryFilter, selectedFeatureFilters, selectedRegionFilters, selectedSeasonFilters, selectedColorFilters, orchidSortOrder, categories, orchids]);

  const _handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: 'Ngô Chí Tài',
      authorRole: 'Quản trị viên',
      avatarLetter: 'N',
      avatarColor: 'bg-[#56642b] text-white',
      content: newPostContent,
      imageUrl: newPostImage || undefined,
      likes: 0,
      likedByMe: false,
      comments: [],
      timeAgo: 'Vừa xong',
      status: 'pending' // Posts now go to pending by default
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setNewPostImage(null);
    addToast('Bài viết đã được gửi và đang chờ duyệt', 'success');
  };

  const _handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Kích thước ảnh tối đa là 2MB để tránh lỗi bộ nhớ', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const _handleToggleLike = (postId: string) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likedByMe: !post.likedByMe,
          likes: post.likedByMe ? Math.max(0, post.likes - 1) : post.likes + 1
        };
      }
      return post;
    }));
  };

  const _handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    const newComment = {
      id: `cmt-${Date.now()}`,
      author: 'Ngô Chí Tài',
      avatarLetter: 'N',
      avatarColor: 'bg-[#56642b] text-white',
      content: commentText,
      timeAgo: 'Vừa xong'
    };

    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    addToast('Đã thêm bình luận', 'success');
  };

  const handleApprovePost = (postId: string) => {
    console.log(`[Moderation] Duyệt bài viết #${postId}`);
    setCommunityPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'approved' } : p));
    setOpenModerationModal(false);
    addToast('Đã duyệt bài viết thành công', 'success');
  };

  const handleRejectPost = (postId: string) => {
    console.log(`[Moderation] Từ chối bài viết #${postId}`);
    setCommunityPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'rejected' } : p));
    setOpenModerationModal(false);
    addToast('Đã từ chối bài viết', 'error');
  };

  const handleAddNewOrchid = async (orchidPayload: Omit<Orchid, 'id' | 'createdAt'>) => {
    try {
      const created = await createOrchid(orchidPayload);
      const createdId = typeof created === 'string'
        ? created
        : created && typeof created === 'object' && 'id' in created && typeof created.id === 'string'
          ? created.id
          : undefined;
      setOrchids((current) => [
        ...current.filter((item) => item.id !== createdId && item.slug !== orchidPayload.slug),
        { ...orchidPayload, id: createdId },
      ]);
      
      // update count in categories locally
      setCategories(prevCats => prevCats.map(cat => {
        if (orchidPayload.categoryIds.includes(cat.id)) {
          return { ...cat, orchidCount: cat.orchidCount + 1 };
        }
        return cat;
      }));
      
      addToast(`Thêm loài lan thành công: ${orchidPayload.name}`, 'success');
      loadOrchids();
      setPublicOrchidRevision((revision) => revision + 1);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể thêm loài lan.', 'error');
      throw error;
    }
  };

  const handleOpenEditOrchid = async (id: string) => {
    try {
      const orchid = await getOrchidById(id);
      setEditingOrchid(orchid);
      setOpenAddOrchid(true);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông tin hoa lan.', 'error');
    }
  };

  const handleUpdateOrchid = async (id: string, updated: Omit<Orchid, 'id' | 'createdAt'>) => {
    try {
      await updateOrchid(id, updated);
      addToast(`Đã lưu thay đổi cho loài: ${updated.name}`, 'success');
      setEditingOrchid(null);
      loadOrchids();
      setPublicOrchidRevision((revision) => revision + 1);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật loài lan.', 'error');
      throw error;
    }
  };

  const handleDeleteOrchid = async (id: string, name: string) => {
    if (!(await confirmDelete({
      title: 'Xóa loài hoa lan?',
      message: 'Loài lan này sẽ bị gỡ khỏi danh mục và không thể khôi phục.',
      itemName: name,
      confirmLabel: 'Xóa hoa lan',
    }))) return;
    try {
      await deleteOrchid(id);
      
      const oToDelete = orchids.find(o => o.id === id);
      if (oToDelete) {
        setCategories(prevCats => prevCats.map(cat => {
          if (oToDelete.categoryIds.includes(cat.id)) {
            return { ...cat, orchidCount: Math.max(0, cat.orchidCount - 1) };
          }
          return cat;
        }));
      }
      
      addToast(`Đã gỡ bỏ: ${name}`, 'info');
      loadOrchids();
      setPublicOrchidRevision((revision) => revision + 1);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa loài lan.', 'error');
    }
  };

  const handleReplyQuestion = (qId: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, replied: true, replyContent: text, repliedBy: 'Ngô Chí Tài' } : q));
    addToast(`Đã trả lời câu hỏi trực tiếp`, 'success');
  };

  const handleAddCategory = async (payload: Omit<Category, 'id' | 'orchidCount'>) => {
    const normalizedName = payload.name.trim().toLocaleLowerCase('vi');
    const slug = payload.slug || createSlug(payload.name);

    try {
      const duplicate = categories.find((category) =>
        category.name.trim().toLocaleLowerCase('vi') === normalizedName
        || category.slug === slug
      );
      if (duplicate) {
        throw new Error(`Danh mục “${duplicate.name}” đã tồn tại. Hãy dùng nút Sửa để đổi danh mục cha hoặc nội dung.`);
      }
      await createCategory({
        name: payload.name.trim(),
        description: payload.description.trim(),
        slug,
        parentId: payload.parentId ?? null,
      });
      const refreshedCategories = await getCategories({
        pageNumber: 1,
        pageSize: 100,
        sortBy: 'name',
        sortDescending: false,
      });
      setCategories(refreshedCategories.items);
      addToast(`Đã khởi tạo phân mục: ${payload.name}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo danh mục mới.';
      addToast(message, 'error');
      throw error;
    }
  };

  const handleOpenEditCategory = async (id: string) => {
    const cachedCategory = categories.find((category) => category.id === id);
    if (cachedCategory) {
      setEditingCategory(cachedCategory);
      setOpenAddCategory(true);
      return;
    }

    try {
      const category = await getCategoryById(id);
      setEditingCategory(category);
      setOpenAddCategory(true);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông tin danh mục.', 'error');
    }
  };

  const handleUpdateCategory = async (
    id: string,
    payload: Omit<Category, 'id' | 'orchidCount'>
  ) => {
    const normalizedName = payload.name.trim().toLocaleLowerCase('vi');
    // Preserve an existing slug while moving a category. Some backend records
    // were created with legacy slugs and fail when slug + parent change together.
    const slug = payload.slug || createSlug(payload.name);

    try {
      const duplicate = categories.find((category) =>
        category.id !== id
        && (category.name.trim().toLocaleLowerCase('vi') === normalizedName || category.slug === slug)
      );
      if (duplicate) {
        throw new Error(`Tên hoặc slug đang trùng với danh mục “${duplicate.name}”.`);
      }
      await updateCategory(id, {
        id,
        name: payload.name.trim(),
        description: payload.description.trim(),
        slug,
        parentId: payload.parentId ?? null,
      });
      const refreshedCategories = await getCategories({ pageNumber: 1, pageSize: 100, sortBy: 'name' });
      setCategories(refreshedCategories.items);
      setEditingCategory(null);
      addToast(`Đã cập nhật danh mục: ${payload.name}`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật danh mục.', 'error');
      throw error;
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!(await confirmDelete({
      title: 'Xóa danh mục lan?',
      message: 'Hãy chắc chắn danh mục không còn dữ liệu phụ thuộc trước khi xóa.',
      itemName: category.name,
      confirmLabel: 'Xóa danh mục',
    }))) return;
    try {
      await deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      addToast(`Đã xóa danh mục: ${category.name}`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa danh mục.', 'error');
    }
  };

  const handleUploadDocumentSuccess = (filename: string) => {
    addToast(`Lưu trữ tài liệu thành công: "${filename}"`, 'success');
    void loadDocuments(docPage);
    // auto append a system notification too
    setNotifications(prev => [
      { id: `sys-${Date.now()}`, text: `Tập tin ${filename} được tải lên lưu trữ`, time: 'Vừa xong', read: false },
      ...prev
    ]);
  };

  const handleSaveUser = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        const isCurrentAccount = editingUser.email.toLowerCase() === currentUser?.toLowerCase();
        await updateUser(editingUser.id, {
          fullName: values.fullName,
          email: editingUser.email,
          avatarUrl: values.avatarUrl,
        });
        if (values.password) {
          await resetUserPassword(editingUser.id, values.password, values.confirmPassword);
        }
        if (isCurrentAccount) {
          setCurrentUser(values.email);
          if (localStorage.getItem('orchidee_admin_user')) localStorage.setItem('orchidee_admin_user', values.email);
          if (sessionStorage.getItem('orchidee_admin_user')) sessionStorage.setItem('orchidee_admin_user', values.email);
          const updatedProfile: UserListItem = {
            ...editingUser,
            fullName: values.fullName,
            email: editingUser.email,
            avatarUrl: values.avatarUrl,
          };
          if (localStorage.getItem('orchidee_auth_token')) localStorage.setItem('orchidee_user', JSON.stringify(updatedProfile));
          if (sessionStorage.getItem('orchidee_auth_token')) sessionStorage.setItem('orchidee_user', JSON.stringify(updatedProfile));
        }
        addToast(`Đã cập nhật người dùng: ${values.fullName}`, 'success');
      } else {
        await createUser({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          avatarUrl: values.avatarUrl,
        });
        addToast(`Đã tạo người dùng: ${values.fullName}`, 'success');
      }
      setEditingUser(null);
      await loadUserCount(activeTab === 'users' ? searchQuery.trim() : '', userSortOrder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu người dùng.';
      addToast(message, 'error');
      throw error;
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.title.trim() || (!editingDocument && !documentFile)) {
      addToast(editingDocument ? 'Vui lòng nhập tiêu đề tài liệu' : 'Vui lòng nhập tiêu đề và chọn tệp tài liệu', 'error');
      return;
    }
    if (documentFile && documentFile.size > 50 * 1024 * 1024) {
      addToast('Tệp tài liệu không được vượt quá 50 MB', 'error');
      return;
    }

    setUploadingDocument(true);
    try {
      if (editingDocument?.id) {
        await updateDocument(editingDocument.id, {
          title: documentForm.title,
          description: documentForm.description,
          categoryId: documentForm.categoryId,
        });
        addToast('Cập nhật tài liệu thành công', 'success');
      } else {
        await createDocument({
          file: documentFile!,
          title: documentForm.title,
          description: documentForm.description,
          categoryId: documentForm.categoryId,
        });
        addToast('Tải lên tài liệu thành công', 'success');
      }
      setShowDocumentForm(false);
      setEditingDocument(null);
      setDocumentFile(null);
      setDocumentForm({ title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '', categoryId: null });
      await loadDocuments(docPage);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải lên tài liệu', 'error');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (id: string | undefined) => {
    if (!id) return;
    if (!(await confirmDelete({
      title: 'Xóa tài liệu?',
      message: 'Tài liệu và tệp đính kèm sẽ bị gỡ khỏi thư viện.',
      confirmLabel: 'Xóa tài liệu',
    }))) return;
    try {
      await deleteDocument(id);
      const refreshedDocuments = await getDocuments(docPage, 10);
      setDocumentsData(refreshedDocuments);

      if (refreshedDocuments.items.some((document) => document.id === id)) {
        throw new Error('Backend báo thành công nhưng tài liệu vẫn còn trong cơ sở dữ liệu. Vui lòng kiểm tra API DELETE /api/Documents/{id}.');
      }

      addToast('Đã xóa tài liệu', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Lỗi khi xóa tài liệu', 'error');
    }
  };


  const handleDeleteUser = async (user: UserListItem) => {
    if (user.email === currentUser) {
      addToast('Không thể xóa tài khoản đang đăng nhập.', 'error');
      return;
    }
    if (!(await confirmDelete({
      title: 'Xóa tài khoản người dùng?',
      message: 'Người dùng sẽ không thể tiếp tục truy cập bằng tài khoản này.',
      itemName: user.fullName || user.email,
      confirmLabel: 'Xóa tài khoản',
    }))) return;
    try {
      await deleteUser(user.id);
      await loadUserCount(activeTab === 'users' ? searchQuery.trim() : '', userSortOrder);
      addToast(`Đã xóa người dùng: ${user.fullName}`, 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa người dùng.', 'error');
    }
  };

  // Notification clear
  const _clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Filtering & Sorting ---
  const filteredOrchids = adminOrchids;

  const orchidAdvancedFilterCount = selectedFeatureFilters.length
    + selectedRegionFilters.length
    + selectedSeasonFilters.length
    + selectedColorFilters.length;
  const hasOrchidFilters = Boolean(searchQuery || selectedCategoryFilter || orchidAdvancedFilterCount);

  const clearOrchidFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('');
    setSelectedFeatureFilters([]);
    setSelectedRegionFilters([]);
    setSelectedSeasonFilters([]);
    setSelectedColorFilters([]);
  };

  const handleCreateDocumentCategory = async (values: DocumentCategoryValues) => {
    const normalizedName = values.name.trim().toLocaleLowerCase('vi');
    const slug = values.slug || createSlug(values.name);
    const duplicate = documentCategories.find((category) =>
      category.name.trim().toLocaleLowerCase('vi') === normalizedName || category.slug === slug
    );
    if (duplicate) throw new Error(`Danh mục “${duplicate.name}” đã tồn tại.`);

    try {
      await createDocumentCategory({
        name: values.name.trim(),
        description: values.description.trim(),
        slug,
        parentId: values.parentId,
      });
      await loadDocumentCategories();
      addToast(`Đã tạo danh mục tài liệu: ${values.name}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo danh mục tài liệu.';
      addToast(message, 'error');
      throw error;
    }
  };

  const handleOpenEditDocument = (document: DocumentItem) => {
    setEditingDocument(document);
    setDocumentFile(null);
    setDocumentForm({
      title: document.title,
      description: document.description ?? '',
      originalName: document.originalName,
      extension: document.extension,
      sizeBytes: document.sizeBytes,
      url: document.url,
      categoryId: document.categoryId ?? null,
      categoryName: document.categoryName,
      categorySlug: document.categorySlug,
    });
    setShowDocumentForm(true);
  };

  const handleCloseDocumentForm = () => {
    setShowDocumentForm(false);
    setEditingDocument(null);
    setDocumentFile(null);
    setDocumentForm({ title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '', categoryId: null });
  };

  const handleUpdateDocumentCategory = async (id: string, values: DocumentCategoryValues) => {
    const normalizedName = values.name.trim().toLocaleLowerCase('vi');
    const slug = values.slug || createSlug(values.name);
    const duplicate = documentCategories.find((category) =>
      category.id !== id
      && (category.name.trim().toLocaleLowerCase('vi') === normalizedName || category.slug === slug)
    );
    if (duplicate) throw new Error(`Danh mục “${duplicate.name}” đã tồn tại.`);

    try {
      await updateDocumentCategory(id, {
        name: values.name.trim(),
        description: values.description.trim(),
        slug,
        parentId: values.parentId,
      });
      await loadDocumentCategories();
      addToast(`Đã cập nhật danh mục tài liệu: ${values.name}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật danh mục tài liệu.';
      addToast(message, 'error');
      throw error;
    }
  };

  const handleDeleteDocumentCategory = async (category: DocumentCategory) => {
    if (!(await confirmDelete({
      title: 'Xóa danh mục tài liệu?',
      message: 'Hãy chắc chắn danh mục không còn tài liệu hoặc danh mục con trước khi xóa.',
      itemName: category.name,
      confirmLabel: 'Xóa danh mục',
    }))) return;
    try {
      await deleteDocumentCategory(category.id);
      await loadDocumentCategories();
      addToast(`Đã xóa danh mục tài liệu: ${category.name}`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa danh mục tài liệu.', 'error');
    }
  };

  // filteredArticles removed

  const filteredCategories = categories.filter(cat => {
    return cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (cat.scientificName && cat.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  const filteredRootCategories = filteredCategories
    .filter((category) => !category.parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  const pagedRootCategories = filteredRootCategories.slice(
    (categoryPage - 1) * adminPageSize,
    categoryPage * adminPageSize,
  );

  const filteredUsers = users;
  const pagedOrchids = useMemo(
    () => filteredOrchids.slice((orchidPage - 1) * adminPageSize, orchidPage * adminPageSize),
    [adminPageSize, filteredOrchids, orchidPage],
  );
  const pagedUsers = useMemo(
    () => filteredUsers.slice((userPage - 1) * adminPageSize, userPage * adminPageSize),
    [adminPageSize, filteredUsers, userPage],
  );
  const pagedCareArticles = useMemo(
    () => careArticles.slice((careArticlePage - 1) * adminPageSize, careArticlePage * adminPageSize),
    [adminPageSize, careArticlePage, careArticles],
  );

  useEffect(() => {
    setCategoryPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setOrchidPage(1);
  }, [
    searchQuery,
    selectedCategoryFilter,
    selectedFeatureFilters,
    selectedRegionFilters,
    selectedSeasonFilters,
    selectedColorFilters,
    orchidSortOrder,
  ]);

  useEffect(() => {
    setUserPage(1);
  }, [searchQuery, userSortOrder]);

  useEffect(() => {
    setCareArticlePage(1);
  }, [activeTab]);

  useEffect(() => {
    setCategoryPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredRootCategories.length / adminPageSize))));
  }, [adminPageSize, filteredRootCategories.length]);

  useEffect(() => {
    setOrchidPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredOrchids.length / adminPageSize))));
  }, [adminPageSize, filteredOrchids.length]);

  useEffect(() => {
    setUserPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredUsers.length / adminPageSize))));
  }, [adminPageSize, filteredUsers.length]);

  useEffect(() => {
    setCareArticlePage((page) => Math.min(page, Math.max(1, Math.ceil(careArticles.length / adminPageSize))));
  }, [adminPageSize, careArticles.length]);

  const currentUserProfile = users.find((user) =>
    user.email.toLowerCase() === currentUser?.toLowerCase()
  ) || getStoredSessionUserProfile();
  const currentDisplayName = currentUserProfile?.fullName || currentUser || 'Quản trị viên';
  const currentAvatarUrl = currentUserProfile?.avatarUrl || '';
  const currentUserInitial = currentDisplayName.charAt(0).toUpperCase();

  const handleOpenCurrentProfile = async () => {
    let profile = currentUserProfile;
    if (!profile && currentUser) {
      setLoadingUsers(true);
      try {
        const result = await getUsers(1, 10, currentUser);
        profile = result.items.find((user) => user.email.toLowerCase() === currentUser.toLowerCase()) ?? null;
        if (profile) {
          setUsers((current) => [profile!, ...current.filter((user) => user.id !== profile!.id)]);
        }
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Không thể tải thông tin tài khoản.', 'error');
      } finally {
        setLoadingUsers(false);
      }
    }

    if (!profile) {
      addToast('Không tìm thấy hồ sơ của tài khoản đang đăng nhập trong Users API.', 'error');
      return;
    }

    setEditingUser(profile);
    setOpenInviteAdmin(true);
    setShowProfileCard(false);
  };

  const currentSessionIsAdmin = isStoredSessionAdmin();

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b] font-sans transition-colors duration-300">

      {/* =================== SCREEN 0: HOME =================== */}
      {screen === "home" && <CustomerHome categories={categories} orchids={orchids} onNavigate={(s, id) => setScreen(s as ScreenType, id)} />}

      {screen === "list_orchids" && (
        <ListOrchids
          categoryId={selectedCategoryId}
          categories={categories}
          orchids={orchids}
          onNavigate={(s, id) => setScreen(s as ScreenType, id)}
          isAdmin={currentSessionIsAdmin}
          dataRevision={publicOrchidRevision}
          onAddOrchid={currentSessionIsAdmin ? () => { setEditingOrchid(null); setOpenAddOrchid(true); } : undefined}
          onEditOrchid={currentSessionIsAdmin ? handleOpenEditOrchid : undefined}
          onDeleteOrchid={currentSessionIsAdmin ? handleDeleteOrchid : undefined}
          onAddCategory={currentSessionIsAdmin ? () => { setEditingCategory(null); setOpenAddCategory(true); } : undefined}
          onEditCategory={currentSessionIsAdmin ? handleOpenEditCategory : undefined}
          onDeleteCategory={currentSessionIsAdmin ? handleDeleteCategory : undefined}
        />
      )}
      
      {screen === "orchid_detail" && selectedOrchidId && <OrchidDetail id={selectedOrchidId} categories={categories} onNavigate={(s, id) => setScreen(s as ScreenType, id)} />}

      {screen === "search" && <GlobalSearch />}

      {/* =================== SCREEN 1: SIGN UP =================== */}
      {screen === "signup" && (
        <div id="signup_screen" className="h-screen overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left panel: Form */}
          <div className="flex items-center justify-center p-4 md:p-8 lg:p-10 bg-white animate-fade-in h-full">
            <div className="w-full max-w-[400px] space-y-4">
              
              {/* Form Header */}
              <div className="space-y-1.5">
                <h1 className="font-serif text-[32px] leading-[40px] font-normal text-[#1a1c1b]">
                  Tạo tài khoản mới
                </h1>
                <p className="text-sm leading-6 text-[#5a5c5b] font-light">
                  Trở thành thành viên để lưu trữ tài liệu, đánh dấu loài lan yêu thích và kết nối với các chuyên gia.
                </p>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSignUp} className="space-y-3">
                
                {/* Họ và tên */}
                <div className="relative">
                  <input
                    id="input_fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ và Tên"
                    className="w-full px-4 py-2.5 border border-[#e2e3e1] focus:border-[#56642b] focus:outline-none rounded-[2px] placeholder-[#8c8e8c] text-xs text-[#1a1c1b] transition-colors"
                  />
                </div>

                {/* Email address */}
                <div className="relative">
                  <input
                    id="input_email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Địa chỉ Email"
                    className="w-full px-4 py-2.5 border border-[#e2e3e1] focus:border-[#56642b] focus:outline-none rounded-[2px] placeholder-[#8c8e8c] text-xs text-[#1a1c1b] transition-colors"
                  />
                </div>

                {/* Mật khẩu */}
                <div className="relative">
                  <input
                    id="input_password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full pl-4 pr-12 py-2.5 border border-[#e2e3e1] focus:border-[#56642b] focus:outline-none rounded-[2px] placeholder-[#8c8e8c] text-xs text-[#1a1c1b] transition-colors"
                  />
                  <button
                    id="toggle_show_pwd"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c8e8c] hover:text-[#56642b] focus:outline-none"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="relative">
                  <input
                    id="input_confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full pl-4 pr-12 py-2.5 border border-[#e2e3e1] focus:border-[#56642b] focus:outline-none rounded-[2px] placeholder-[#8c8e8c] text-xs text-[#1a1c1b] transition-colors"
                  />
                  <button
                    id="toggle_show_confirm_pwd"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c8e8c] hover:text-[#56642b] focus:outline-none"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Agreement checkbox */}
                <div className="flex items-start space-x-3 pt-1">
                  <input
                    id="checkbox_agree"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-4 font-sans h-4 rounded-[1px] border-[#e2e3e1] text-[#56642b] focus:ring-[#56642b]"
                  />
                  <label htmlFor="checkbox_agree" className="text-[11px] text-[#5a5c5b] leading-5 cursor-pointer">
                    Tôi xác nhận thông tin đăng ký là chính xác.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  id="btn_submit_signup"
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2.5 bg-[#56642b] hover:bg-[#3f4b1e] disabled:opacity-60 disabled:cursor-wait text-white rounded-[2px] font-semibold text-[11px] tracking-wider uppercase text-center cursor-pointer transition-all duration-300 shadow-sm"
                >
                  {isRegistering ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
                </button>
              </form>

              {/* Separator line */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#eeeeec]"></div>
                <span className="flex-shrink mx-4 text-2xs uppercase tracking-widest text-[#a1a3a1] font-medium">HOẶC</span>
                <div className="flex-grow border-t border-[#eeeeec]"></div>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-1 gap-4">
                <GoogleLoginButton onCredential={handleGoogleLogin} disabled={isLoggingIn || isRegistering} />
              </div>

              {/* Login toggle links */}
              <div className="text-center pt-2">
                <button
                  id="link_to_login"
                  onClick={() => setScreen("login")}
                  className="text-[11px] text-[#5a5c5b] hover:text-[#1a1c1b] transition-colors cursor-pointer"
                >
                  Bạn đã có tài khoản? <span className="font-semibold text-[#56642b] hover:underline">Đăng nhập tại đây</span>
                </button>
              </div>
              <div className="text-center mt-2">
                <button 
                  onClick={() => setScreen("home")}
                  className="text-[11px] text-[#8c8e8c] hover:text-[#56642b] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  ← Về Trang chủ
                </button>
              </div>

            </div>
          </div>

          {/* Right panel: Scenic visual background (As shown in screenshot) */}
          <div className="relative hidden md:block overflow-hidden h-full">
            
            {/* Main Orchid foliage back-drop image */}
            <img 
              src={BG_IMAGE_URL} 
              alt="Orchid garden background" 
              className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 select-none hover:scale-100"
              referrerPolicy="no-referrer"
            />
            {/* Shadow gradients / atmospheric film filters over image */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-emerald-950/20 to-black/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[#56642b]/15 mix-blend-color"></div>

            {/* "Orchids" White brand-text at absolute top left */}
            <div className="absolute top-12 left-12 z-20">
              <button onClick={() => setScreen("home")} className="orchids-logo text-[32px] text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Poetic quote block at absolute bottom-right corner */}
            <div className="absolute bottom-12 right-12 left-12 max-w-lg ml-auto text-right space-y-3 z-20">
              <p className="font-display-serif italic text-white text-2xl lg:text-[28px] font-light leading-relaxed tracking-wide drop-shadow-md">
                "Bắt đầu hành trình lưu giữ và khám phá thế giới hoa lan"
              </p>
              
              {/* Minimalist gold/olive line accent */}
              <div className="w-16 h-[1.5px] bg-[#d6e7a0] ml-auto mt-2"></div>
            </div>

          </div>

        </div>
      )}


      {/* =================== SCREEN 2: LOGIN =================== */}
      {screen === "login" && (
        <div id="login_screen" className="h-screen overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left panel: Background Image */}
          <div className="relative hidden md:block overflow-hidden h-full">
            <img 
              src={BG_IMAGE_URL} 
              alt="Orchid garden background" 
              className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 select-none hover:scale-100"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-emerald-950/20 to-black/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[#56642b]/15 mix-blend-color"></div>

            {/* "Orchids" White logo top left */}
            <div className="absolute top-12 left-12 z-20">
              <button onClick={() => setScreen("home")} className="orchids-logo text-[32px] text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Caption on the left-hand bottom-left as requested in prompt screenshot */}
            <div className="absolute bottom-12 left-12 right-12 max-w-md text-left space-y-3 z-20">
              <p className="font-display-serif text-white text-3xl lg:text-[36px] font-normal leading-relaxed tracking-wide drop-shadow-md">
                Khám phá vẻ đẹp độc bản của tự nhiên
              </p>
              <div className="w-16 h-[1.5px] bg-[#d6e7a0] mt-2"></div>
            </div>

          </div>

          {/* Right panel: Form */}
          <div className="flex items-center justify-center p-4 md:p-8 lg:p-10 bg-white animate-fade-in h-full">
            <div className="w-full max-w-[400px] space-y-4">
              
              {/* Form Title & Description */}
              <div className="space-y-1.5">
                <h1 className="font-serif text-[32px] leading-[40px] font-normal text-[#1a1c1b]">
                  Chào mừng quay trở lại
                </h1>
                <p className="text-sm text-[#5a5c5b] font-light">
                  Vui lòng đăng nhập để tiếp tục tra cứu và lưu trữ tài liệu quý giá.
                </p>
              </div>

              {/* Form elements with Underlined design as shown in screenshot */}
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                
                {/* Email address field (underlined) */}
                <div className="relative border-b border-[#e2e3e1] focus-within:border-[#56642b] transition-colors py-1.5">
                  <span className="absolute -top-2.5 left-0 text-[10px] uppercase tracking-widest text-[#8c8e8c] font-semibold">Email của bạn</span>
                  <input
                    id="login_email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@orchidee.com"
                    className="w-full bg-transparent border-none py-1 focus:outline-none text-xs text-[#1a1c1b] placeholder-gray-300"
                  />
                </div>

                {/* Password field (underlined with eyeball toggle) */}
                <div className="relative border-b border-[#e2e3e1] focus-within:border-[#56642b] transition-colors py-1.5 pt-4">
                  <span className="absolute -top-2.5 left-0 text-[10px] uppercase tracking-widest text-[#8c8e8c] font-semibold">Mật khẩu</span>
                  <input
                    id="login_password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none py-1 pr-10 focus:outline-none text-xs text-[#1a1c1b] placeholder-gray-300"
                  />
                  <button
                    id="login_toggle_show_pwd"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 bottom-2 text-[#8c8e8c] hover:text-[#56642b] focus:outline-none"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Checkbox grid: Remember and Forget */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-[11px] text-[#5a5c5b] cursor-pointer selection:bg-transparent">
                    <input
                      id="checkbox_remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-[1px] border-[#e2e3e1] text-[#56642b] focus:ring-[#56642b]"
                    />
                    <span>Duy trì đăng nhập</span>
                  </label>
                  <button type="button" onClick={() => setScreen("forgot_password")} className="text-[11px] text-[#56642b] hover:underline font-medium">Quên mật khẩu?</button>
                </div>

                {/* Button login */}
                <button
                  id="btn_submit_login"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-[#56642b] hover:bg-[#3f4b1e] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-[2px] font-semibold text-[11px] tracking-wider uppercase text-center cursor-pointer transition-all duration-300 shadow-sm"
                >
                  {isLoggingIn ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                </button>
              </form>

              {/* Separator line */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#eeeeec]"></div>
                <span className="flex-shrink mx-4 text-2xs uppercase tracking-widest text-[#a1a3a1] font-medium">Hoặc</span>
                <div className="flex-grow border-t border-[#eeeeec]"></div>
              </div>

              {/* Social login buttons */}
              <div className="grid grid-cols-1 gap-4">
                <GoogleLoginButton onCredential={handleGoogleLogin} disabled={isLoggingIn} />
              </div>

              {/* Toggle to Signup */}
              <div className="text-center pt-2">
                <button 
                  onClick={() => setScreen("signup")}
                  className="text-[11px] text-[#5a5c5b] hover:text-[#1a1c1b] transition-colors cursor-pointer animate-pulse"
                >
                  Bạn chưa có tài khoản? <span className="font-semibold text-[#56642b] hover:underline">Đăng ký ngay</span>
                </button>
              </div>
              <div className="text-center mt-2">
                <button 
                  onClick={() => setScreen("home")}
                  className="text-[11px] text-[#8c8e8c] hover:text-[#56642b] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  ← Về Trang chủ
                </button>
              </div>

              {/* Toggle to Signup */}
              

            </div>
          </div>

        </div>
      )}


      
      {/* =================== SCREEN 3: FORGOT PASSWORD =================== */}
      {screen === "forgot_password" && (
        <div id="forgot_password_screen" className="h-screen overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left panel: Background Image */}
          <div className="relative hidden md:block overflow-hidden h-full">
            <img 
              src={BG_IMAGE_URL} 
              alt="Orchid garden background" 
              className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 select-none hover:scale-100"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-emerald-950/20 to-black/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[#56642b]/15 mix-blend-color"></div>

            {/* "Orchids" White logo top left */}
            <div className="absolute top-12 left-12 z-20">
              <button onClick={() => setScreen("home")} className="orchids-logo text-[32px] text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Caption on the left-hand bottom-left as requested in prompt screenshot */}
            <div className="absolute bottom-12 left-12 right-12 max-w-md text-left space-y-3 z-20">
              <p className="font-display-serif text-white text-3xl lg:text-[36px] font-normal leading-relaxed tracking-wide drop-shadow-md">
                Khám phá vẻ đẹp độc bản của tự nhiên
              </p>
              <div className="w-16 h-[1.5px] bg-[#d6e7a0] mt-2"></div>
            </div>

          </div>

          {/* Right panel: Form */}
          <div className="flex items-center justify-center p-4 md:p-8 lg:p-10 bg-white animate-fade-in h-full">
            <div className="w-full max-w-md space-y-4">
              
              {/* Form Title & Description */}
              <div className="space-y-1.5">
                <h1 className="font-serif text-[32px] leading-[40px] font-normal text-[#1a1c1b]">
                  Quên mật khẩu?
                </h1>
                <p className="text-sm text-[#5a5c5b] font-light">
                  Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
              </div>

              {/* Form elements with Underlined design as shown in screenshot */}
              <form onSubmit={(e) => { e.preventDefault(); addToast("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.", "success"); setScreen("login"); }} className="space-y-4 pt-1">
                
                {/* Email address field (underlined) */}
                <div className="relative border-b border-[#e2e3e1] focus-within:border-[#56642b] transition-colors py-1.5">
                  <span className="absolute -top-2.5 left-0 text-[10px] uppercase tracking-widest text-[#8c8e8c] font-semibold">Email của bạn</span>
                  <input
                    id="login_email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@orchidee.com"
                    className="w-full bg-transparent border-none py-1 focus:outline-none text-xs text-[#1a1c1b] placeholder-gray-300"
                  />
                </div>

                

                

                {/* Button login */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#56642b] hover:bg-[#3f4b1e] text-white rounded-[2px] font-semibold text-[11px] tracking-wider uppercase text-center cursor-pointer transition-all duration-300 shadow-sm"
                >
                  GỬI LIÊN KẾT ĐẶT LẠI
                </button>
              </form>

              {/* Back to login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="text-[11px] text-[#5a5c5b] hover:text-[#1a1c1b] transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#56642b] hover:underline">Quay lại Đăng nhập</span>
                </button>
              </div>

              {/* Toggle to Signup */}
              

            </div>
          </div>

        </div>
      )}


      
      

{screen === "dashboard" && (
      <div className="min-h-screen bg-[#f9f9f7] font-sans text-[#1a1c1b] flex">
      
      {/* Side Navigation Bar */}
      <aside className={`border-r border-[#c4c7c7] fixed h-screen left-0 top-0 bg-[#f9f9f7] flex flex-col z-40 transition-[width] duration-300 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`${isSidebarOpen ? 'px-6' : 'px-1'} overflow-hidden py-8`}>
          <h1 className={`orchids-logo whitespace-nowrap text-[#56642b] transition-all duration-300 ${isSidebarOpen ? 'text-left text-2xl' : 'text-center text-[15px]'}`}>
            Orchids
          </h1>
          <p className={`${isSidebarOpen ? 'block' : 'hidden'} text-[10px] text-outline tracking-widest mt-0.5 font-mono uppercase`}>
            HỆ THỐNG QUẢN TRỊ
          </p>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
          {/* 1. Tổng Quan */}
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            title={!isSidebarOpen ? 'Tổng quan' : undefined}
            className={`order-0 flex items-center px-4 py-3 w-full transition-all duration-300 rounded text-left ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              activeTab === 'overview'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs uppercase tracking-wider font-semibold font-sans`}>Tổng quan</span>
          </button>

          <button
            onClick={() => handleAdminMenuClick('orchids')}
            title={!isSidebarOpen ? 'Quản lý hoa lan' : undefined}
            className={`order-10 flex w-full items-center rounded px-4 py-3 text-left transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              ['categories', 'orchids'].includes(activeTab)
                ? 'bg-[#d6e7a1]/20 font-bold text-[#56642b]'
                : 'text-[#434748] hover:bg-[#d6e7a1]/20 hover:text-[#56642b]'
            }`}
          >
            <Flower2 className="h-5 w-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs font-semibold uppercase tracking-wider`}>Quản lý hoa lan</span>
            <ChevronRight className={`${isSidebarOpen ? 'block' : 'hidden'} ml-auto h-4 w-4 transition-transform ${expandedAdminMenus.orchids ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => handleAdminMenuClick('applications')}
            title={!isSidebarOpen ? 'Ứng dụng' : undefined}
            className={`order-20 flex w-full items-center rounded px-4 py-3 text-left transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              ['applications', 'application_cats'].includes(activeTab)
                ? 'bg-[#d6e7a1]/20 font-bold text-[#56642b]'
                : 'text-[#434748] hover:bg-[#d6e7a1]/20 hover:text-[#56642b]'
            }`}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs font-semibold uppercase tracking-wider`}>Ứng dụng</span>
            <ChevronRight className={`${isSidebarOpen ? 'block' : 'hidden'} ml-auto h-4 w-4 transition-transform ${expandedAdminMenus.applications ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => handleAdminMenuClick('cultivation')}
            title={!isSidebarOpen ? 'Cách trồng và chăm sóc' : undefined}
            className={`order-30 flex w-full items-center rounded px-4 py-3 text-left transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              ['care', 'cultivation_cats'].includes(activeTab)
                ? 'bg-[#d6e7a1]/20 font-bold text-[#56642b]'
                : 'text-[#434748] hover:bg-[#d6e7a1]/20 hover:text-[#56642b]'
            }`}
          >
            <FileText className="h-5 w-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs font-semibold uppercase tracking-wider`}>Cách trồng và chăm sóc</span>
            <ChevronRight className={`${isSidebarOpen ? 'block' : 'hidden'} ml-auto h-4 w-4 transition-transform ${expandedAdminMenus.cultivation ? 'rotate-90' : ''}`} />
          </button>

          {/* 2. Chi Danh Mục */}
          <button
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.orchids ? 'flex' : 'hidden'} order-[11] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'categories'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FolderKanban className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý danh mục lan</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {categories.length}
            </span>
          </button>

          {/* 3. Danh mục Cách trồng và chăm sóc */}
          <button
            onClick={() => { setActiveTab('cultivation_cats'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.cultivation ? 'flex' : 'hidden'} order-[31] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'cultivation_cats'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Layers className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Danh mục CT&amp;CS</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {cultivationCategories.length}
            </span>
          </button>

          {/* 4. Danh mục Ứng dụng */}
          <button
            onClick={() => { setActiveTab('application_cats'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.applications ? 'flex' : 'hidden'} order-[21] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'application_cats'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FolderKanban className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Danh mục ứng dụng</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {applicationCategories.length}
            </span>
          </button>

          {/* 5. Quản lý Hoa Lan */}
          <button
            onClick={() => { setActiveTab('orchids'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.orchids ? 'flex' : 'hidden'} order-[12] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'orchids'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Flower2 className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý loại lan</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {orchids.length}
            </span>
          </button>

          {/* 6. Cách trồng và chăm sóc */}
          <button
            onClick={() => { setActiveTab('care'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.cultivation ? 'flex' : 'hidden'} order-[32] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'care'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý bài CT&amp;CS</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {articleCounts.cultivation}
            </span>
          </button>

          {/* 7. Ứng dụng */}
          <button
            onClick={() => { setActiveTab('applications'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.applications ? 'flex' : 'hidden'} order-[22] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'applications'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý ứng dụng</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {articleCounts.application}
            </span>
          </button>

          {/* 8. Quản lý Tài liệu về Lan */}
          <button
            onClick={() => handleAdminMenuClick('documents')}
            title={!isSidebarOpen ? 'Tài liệu' : undefined}
            className={`order-40 flex items-center px-4 py-3 w-full transition-all duration-300 rounded text-left ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              ['articles', 'document_categories'].includes(activeTab)
                ? 'text-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs uppercase tracking-wider font-semibold font-sans`}>Tài liệu</span>
            <ChevronRight className={`${isSidebarOpen ? 'block' : 'hidden'} ml-auto h-4 w-4 transition-transform ${expandedAdminMenus.documents ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => { setActiveTab('document_categories'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.documents ? 'flex' : 'hidden'} order-[41] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'document_categories'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FolderKanban className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý danh mục tài liệu</span>
            <span className="ml-auto rounded bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-outline">
              {documentCategories.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('articles'); setSearchQuery(''); }}
            className={`${isSidebarOpen && expandedAdminMenus.documents ? 'flex' : 'hidden'} order-[42] w-full items-center gap-3 rounded py-2.5 pl-10 pr-4 text-left transition-all duration-300 ${
              activeTab === 'articles'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FileText className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quản lý tài liệu</span>
            <span className="ml-auto rounded bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-outline">
              {documentsData?.totalCount || 0}
            </span>
          </button>

          {/* 9. Người dùng */}
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            title={!isSidebarOpen ? 'Người dùng' : undefined}
            className={`order-50 flex items-center px-4 py-3 w-full transition-all duration-300 rounded text-left ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              activeTab === 'users'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs uppercase tracking-wider font-semibold font-sans`}>Người dùng</span>
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold`}>
              {userTotalCount}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('community'); setSearchQuery(''); }}
            title={!isSidebarOpen ? 'Quản lý thảo luận' : undefined}
            className={`order-[60] flex w-full items-center rounded px-4 py-3 text-left transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${
              activeTab === 'community'
                ? 'border-r-2 border-[#56642b] bg-[#d6e7a1]/20 font-bold text-[#56642b]'
                : 'text-[#434748] hover:bg-[#d6e7a1]/20 hover:text-[#56642b]'
            }`}
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs font-semibold uppercase tracking-wider`}>
              Thảo luận
            </span>
          </button>

        </nav>

        {/* Footer-styled administrator profile context */}
        <div className={`${isSidebarOpen ? 'p-4' : 'px-3 py-4'} mt-auto border-t border-[#c4c7c7]`}>
          <div className="relative">
            <button 
              onClick={() => setShowProfileCard(!showProfileCard)}
              title={!isSidebarOpen ? currentDisplayName : undefined}
              className={`flex items-center w-full text-left p-1.5 hover:bg-surface-container rounded-lg transition-all ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}
            >
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} className="w-8 h-8 rounded-full border border-antique-gold/20 object-cover" alt={currentDisplayName} referrerPolicy="no-referrer" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-soft-olive flex items-center justify-center font-bold text-[#56642b]">{currentUserInitial}</span>
              )}
              <div className={`${isSidebarOpen ? 'block' : 'hidden'} min-w-0`}>
                <p className="text-xs font-bold text-on-surface truncate leading-tight">{currentDisplayName}</p>
                <p className="text-[9px] text-[#56642b] font-semibold tracking-wider font-mono">
                  {isStoredSessionAdmin() ? 'ADMIN' : 'CUSTOMER'}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {showProfileCard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute bg-white p-4 rounded-xl shadow-xl border border-outline-variant z-50 text-xs space-y-2 ${isSidebarOpen ? 'bottom-12 left-0 right-0' : 'bottom-0 left-14 w-64'}`}
                >
                  <p className="font-bold text-on-surface">Vùng làm việc: VIỆT NAM</p>
                  <p className="text-outline">Cơ sở dữ liệu: Orchids Registry Hub</p>
                  <p className="text-outline font-mono">Phiên bản thiết bị: v4.2.14</p>
                  <button
                    type="button"
                    disabled={loadingUsers}
                    onClick={() => void handleOpenCurrentProfile()}
                    className="w-full rounded border border-botanical-green/30 px-3 py-2 text-[10px] font-bold uppercase text-botanical-green hover:bg-soft-olive/20 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingUsers ? 'Đang tải hồ sơ...' : 'Cài đặt tài khoản'}
                  </button>
                  <div className="pt-2 border-t border-outline-variant flex justify-between">
                    <span className="text-[10px] text-secondary font-mono">IP: 192.168.1.1</span>
                    <span className="text-[10px] text-outline italic">Online</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleLogOut}
            title={!isSidebarOpen ? 'Đăng xuất' : undefined}
            className={`flex w-full items-center px-4 py-2 mt-3 text-error hover:bg-error/10 transition-all duration-300 rounded text-left ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}
          >
            <LogOut className="w-5 h-5" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs uppercase tracking-wider font-semibold font-sans`}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen flex flex-col transition-[margin] duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        
        {/* Top Bar Navigation */}
        <header className="sticky top-0 z-30 bg-[#f9f9f7]/90 backdrop-blur-md border-b border-[#c4c7c7] h-16 flex items-center justify-between px-8">
          <div className="flex items-center gap-6 flex-1 mr-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 -ml-1.5 hover:bg-outline-variant/20 rounded cursor-pointer transition-colors"><Menu className="w-5 h-5 text-[#434748] select-none" /></button>
            
            {/* Search Input Container */}
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchOverlay(true)}
                onBlur={() => setTimeout(() => setShowSearchOverlay(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm mầm lan, tác giả hoặc ID bài viết..."
                className="w-full bg-[#f4f4f2] border-none rounded-full pl-10 pr-4 py-1.5 text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-antique-gold focus:bg-white transition-all"
              />

              {/* Dynamic live fuzzy overlay dashboard */}
              <AnimatePresence>
                {showSearchOverlay && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-10 left-0 right-0 bg-white shadow-2xl border border-outline-variant rounded-xl p-3 z-50 text-xs text-[#1a1c1b] space-y-2 max-h-60 overflow-y-auto"
                  >
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-outline">Kết quả tìm kiếm từ API</p>

                    {loadingAdminSearch ? (
                      <div className="p-4 text-center text-[11px] text-[#56642b]">Đang tìm kiếm...</div>
                    ) : (
                      <>
                        {adminSearchResults.orchids.slice(0, 2).map((orchid) => (
                          <button key={orchid.id} type="button" onMouseDown={() => { setActiveTab('orchids'); setSearchQuery(orchid.name); setShowSearchOverlay(false); }} className="flex w-full items-center gap-2 rounded p-1.5 text-left transition-colors hover:bg-surface-container">
                            <img src={getOrchidImageUrls(orchid)[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"} className="h-7 w-7 rounded object-cover" alt="" referrerPolicy="no-referrer" />
                            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{orchid.name}</strong><span className="block truncate text-[10px] italic text-outline">Loài lan · {orchid.englishName}</span></span>
                          </button>
                        ))}

                        {adminSearchResults.documents.slice(0, 2).map((document) => (
                          <button key={document.id ?? document.url} type="button" onMouseDown={() => { setActiveTab('articles'); setSearchQuery(document.title); setShowSearchOverlay(false); }} className="flex w-full items-center gap-2 rounded p-1.5 text-left transition-colors hover:bg-surface-container">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#eef1e2] text-[#56642b]"><BookOpen className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{document.title}</strong><span className="block truncate text-[10px] text-outline">Tài liệu · {document.originalName}</span></span>
                          </button>
                        ))}

                        {adminSearchResults.cultivation.slice(0, 2).map((article) => (
                          <button key={article.id} type="button" onMouseDown={() => { setActiveTab('care'); setSearchQuery(article.title); setShowSearchOverlay(false); }} className="flex w-full items-center gap-2 rounded p-1.5 text-left transition-colors hover:bg-surface-container">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#eef1e2] text-[#56642b]"><FileText className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{article.title}</strong><span className="block text-[10px] text-outline">Bài trồng &amp; chăm sóc</span></span>
                          </button>
                        ))}

                        {adminSearchResults.applications.slice(0, 2).map((article) => (
                          <button key={article.id} type="button" onMouseDown={() => { setActiveTab('applications'); setSearchQuery(article.title); setShowSearchOverlay(false); }} className="flex w-full items-center gap-2 rounded p-1.5 text-left transition-colors hover:bg-surface-container">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#eef1e2] text-[#56642b]"><Sparkles className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{article.title}</strong><span className="block text-[10px] text-outline">Bài viết ứng dụng</span></span>
                          </button>
                        ))}

                        {adminSearchResults.users.slice(0, 2).map((user) => (
                          <button key={user.id} type="button" onMouseDown={() => { setActiveTab('users'); setSearchQuery(user.fullName || user.email); setShowSearchOverlay(false); }} className="flex w-full items-center gap-2 rounded p-1.5 text-left transition-colors hover:bg-surface-container">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef1e2] text-[#56642b]"><Users className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{user.fullName || user.email}</strong><span className="block truncate text-[10px] text-outline">Người dùng · {user.email}</span></span>
                          </button>
                        ))}

                        {adminSearchResults.orchids.length + adminSearchResults.documents.length + adminSearchResults.cultivation.length + adminSearchResults.applications.length + adminSearchResults.users.length === 0 && (
                          <div className="p-4 text-center text-[11px] text-outline">Không tìm thấy kết quả phù hợp.</div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">

            <div className="h-8 w-[1px] bg-outline-variant" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-xs font-bold text-on-surface leading-snug">{currentDisplayName}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Quản trị viên</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#e2e3e1] overflow-hidden border border-[#c4c7c7] shrink-0">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} className="w-full h-full object-cover" alt={currentDisplayName} referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-[#56642b]">{currentUserInitial}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <div className="flex flex-1 flex-col p-8 pb-12">
          
          {/* ======================= TAB: 1. OVERVIEW ======================= */}
          {activeTab === 'overview' && (
            <AdminDashboardOverview
              displayName={currentDisplayName}
              onAddOrchid={() => setOpenAddOrchid(true)}
              onAddUser={() => { setEditingUser(null); setOpenInviteAdmin(true); }}
              onOpenOrchids={() => { setActiveTab('orchids'); setSearchQuery(''); }}
              onOpenDocuments={() => { setActiveTab('articles'); setSearchQuery(''); }}
              onOpenDiscussions={() => { setActiveTab('community'); setSearchQuery(''); }}
              onOpenListItem={(sectionKey, item) => {
                const normalizedKey = sectionKey.replace(/[^a-z]/gi, '').toLowerCase();
                const record = item !== null && typeof item === 'object' ? item as Record<string, unknown> : {};
                const itemQuery = ['name', 'title', 'fullName', 'email', 'content']
                  .map((key) => record[key])
                  .find((value): value is string => typeof value === 'string' && Boolean(value.trim())) ?? '';
                if (normalizedKey.includes('orchid')) setActiveTab('orchids');
                else if (normalizedKey.includes('document')) setActiveTab('articles');
                else if (normalizedKey.includes('cultivation')) setActiveTab('care');
                else if (normalizedKey.includes('application')) setActiveTab('applications');
                else if (normalizedKey.includes('user')) setActiveTab('users');
                else if (normalizedKey.includes('discussion')) setActiveTab('community');
                else return;
                setSearchQuery(itemQuery);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {SHOW_LEGACY_OVERVIEW && (
            <div className="space-y-10">
              {/* Top Title Bar */}
              <div>
                <div>
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-on-surface">
                    Tổng quan Hệ thống
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Chào mừng trở lại, {currentDisplayName}. Đây là dữ liệu mới nhất từ hệ thống.
                  </p>
                </div>
              </div>

              {/* Statistics Row Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stat 1: Total Orchids */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform duration-500 text-botanical-green">
                    <Layers className="w-24 h-24" />
                  </div>
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Tổng số Loài Lan</p>
                  <h3 className="text-3xl font-serif text-botanical-green font-bold mt-2">{orchids.length}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-secondary font-medium">
                    <Check className="w-4 h-4 text-botanical-green" />
                    <span>Đồng bộ từ API Orchids</span>
                  </div>
                </div>

                {/* Stat 2: Articles */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">TÀI LIỆU VỀ LAN</p>
                  <h3 className="text-3xl font-serif text-[#56642b] font-bold mt-2">{documentsData?.totalCount || 0}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-secondary font-medium">
                    <BookOpen className="w-4 h-4 text-[#56642b]" />
                    <span>{(documentsData?.totalCount || 0)} tài liệu trên hệ thống</span>
                  </div>
                </div>

                {/* Stat 3: Care articles */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider font-sans">Bài hướng dẫn chăm sóc</p>
                  <h3 className="text-3xl font-serif text-[#56642b] font-bold mt-2">{careArticles.length}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-outline">
                    <FileText className="w-4 h-4 text-[#56642b]" />
                    <span>{careArticles.filter((article) => article.isPublished).length} bài đã xuất bản</span>
                  </div>
                </div>

                {/* Stat 4: Admins counting */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Người dùng hệ thống</p>
                  <h3 className="text-3xl font-serif text-antique-gold font-bold mt-2">{userTotalCount}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-antique-gold">
                    <Sparkles className="w-4 h-4 text-antique-gold" />
                    <span>Đồng bộ từ API Users</span>
                  </div>
                </div>
              </div>

              {/* Main Data Grid (8:4 layout) */}
              <div className="grid grid-cols-1 gap-8">
                
                {/* Right Column Layout (4/12 width) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Quick Actions Panel */}
                  <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30">
                    <h4 className="font-serif text-lg font-semibold text-on-surface mb-4">
                      Thao tác nhanh
                    </h4>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => { setEditingUser(null); setOpenInviteAdmin(true); }}
                        className="flex items-center justify-between p-3 w-full bg-[#f4f4f2] hover:bg-[#d6e7a1]/20 rounded-lg group transition-all text-left border border-transparent hover:border-[#56642b]/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-white rounded text-antique-gold shadow-sm">
                            <UserPlus className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-bold text-xs text-on-surface">Mời quản trị viên</p>
                            <p className="text-[10px] text-outline">Cấp quyền truy cập hệ thống</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Orchids Showcase */}
                  <div className="bg-white p-5 luxury-shadow rounded-xl border border-outline-variant/30 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-serif text-lg font-semibold text-on-surface">
                          Các loài lan vừa thêm
                        </h4>
                        <button
                          onClick={() => setOpenAddOrchid(true)}
                          className="text-xs bg-[#56642b]/10 text-[#56642b] p-1.5 rounded hover:bg-[#56642b] hover:text-white transition-all cursor-pointer"
                          title="Thêm loài lan mới"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {orchids.slice(0, 3).map((orc) => (
                          <div key={orc.id} className="flex gap-3 group relative items-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container">
                              <img
                                src={getOrchidImageUrls(orc)[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                alt={orc.name}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                              <p className="font-bold text-xs text-on-surface truncate">{orc.name}</p>
                              <p className="text-[11px] text-outline italic truncate leading-tight mt-0.5">{orc.englishName}</p>
                              <span className="inline-block mt-1 text-[9px] font-mono tracking-tighter bg-antique-gold/15 text-antique-gold px-1.5 py-0.5 rounded">
                                {orc.isPopular ? 'Phổ biến' : 'Thông thường'}
                              </span>
                            </div>

                            {/* Editing / Deleting toolbars */}
                            <div className="absolute right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => orc.id && void handleOpenEditOrchid(orc.id)}
                                className="p-1 rounded bg-[#f4f4f2] text-[#56642b] hover:bg-[#56642b] hover:text-white transition-all cursor-pointer"
                                title="Sửa thông số"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrchid(orc.id!, orc.name)}
                                className="p-1 rounded bg-[#ffdad6] text-error hover:bg-error hover:text-white transition-all cursor-pointer"
                                title="Xóa bỏ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToast('Dọc luồng toàn bộ cơ sở dữ liệu...', 'info');
                        // Expand orchids or redirect
                        setActiveTab('categories');
                      }}
                      className="w-full mt-6 py-2 border border-outline-variant text-[11px] font-bold uppercase tracking-widest text-[#434748] hover:bg-[#f4f4f2] transition-all cursor-pointer"
                    >
                      XEM TẤT CẢ KHO LAN
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* ======================= TAB: 2. CATEGORIES / DANH MỤC ======================= */}
          {activeTab === 'categories' && (
            <div className="flex flex-1 flex-col gap-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản lý danh mục hoa lan</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Tổ chức kho hoa lan theo danh mục nhiều cấp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditingCategory(null); setOpenAddCategory(true); }}
                  className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-botanical-green px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:shadow"
                >
                  <FolderPlus className="h-4 w-4" /> Tạo danh mục mới
                </button>
              </div>

              {/* Category Grid Section */}
              <div className="flex flex-1 flex-col gap-4">
                {loadingCategories && (
                  <p className="py-8 text-center text-sm text-on-surface-variant">
                    Đang tải danh mục từ máy chủ...
                  </p>
                )}
                {!loadingCategories && filteredCategories.length === 0 && (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-white py-14 text-center text-sm text-outline">
                    Chưa có danh mục hoa lan nào.
                  </div>
                )}
                {(() => {
                  const renderCategoryTree = (parentId: string | null, level: number = 0) => {
                    const children = parentId === null
                      ? pagedRootCategories
                      : filteredCategories.filter(c => (c.parentId || null) === parentId);
                    if (children.length === 0) return null;

                    const leaves = children.filter(c => !filteredCategories.some(sub => sub.parentId === c.id));
                    const nodes = children.filter(c => filteredCategories.some(sub => sub.parentId === c.id));

                    return (
                      <div className={`space-y-8 ${level > 0 ? 'mt-6 ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-botanical-green/20' : ''}`}>
                        
                        {/* Render Leaves as Cards */}
                        {leaves.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {leaves.map((cat) => (
                              <div key={cat.id} className="bg-white p-5 border border-outline-variant/40 rounded-xl relative overflow-hidden group hover:border-[#56642b]/50 transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] tracking-widest font-mono text-outline uppercase">DANH MỤC CHI</span>
                                    <span className="text-xs font-bold font-mono text-[#5a682f] bg-[#d6e7a0]/30 px-2 py-0.5 rounded">
                                      {orchids.filter(o => o.categoryIds.includes(cat.id)).length} mầm lan
                                    </span>
                                  </div>
                                  <h4 className="font-serif text-lg font-bold text-charcoal-text mt-3">{cat.name}</h4>
                                  {cat.scientificName && (
                                    <p className="text-xs text-outline italic mt-0.5">{cat.scientificName}</p>
                                  )}
                                  <p className="text-xs text-on-surface-variant leading-relaxed mt-2.5">
                                    {cat.description || "Chưa có mô tả chi tiết thực rễ cụ thể."}
                                  </p>
                                </div>
                                
                                <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex justify-end items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => void handleOpenEditCategory(cat.id)}
                                      className="p-1.5 text-outline hover:text-botanical-green hover:bg-surface-container rounded transition-colors"
                                      title="Chỉnh sửa danh mục"
                                      aria-label={`Chỉnh sửa ${cat.name}`}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCategory(cat)}
                                      className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded transition-colors"
                                      title="Xóa danh mục"
                                      aria-label={`Xóa ${cat.name}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedCategoryFilter(cat.name);
                                        setActiveTab('orchids');
                                        addToast(`Đang lọc hiển thị đến loài thuộc ${cat.name}`, 'info');
                                      }}
                                      className="text-[10px] text-secondary font-bold font-sans hover:underline cursor-pointer ml-1"
                                    >
                                      Xem lan →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Render Nodes as Sections */}
                        {nodes.map(node => {
                          const nodeChildren = filteredCategories.filter(c => c.parentId === node.id);
                          return (
                            <div key={node.id} className={level === 0 ? "bg-surface-cream rounded-2xl p-6 border border-outline-variant/30" : "mt-8"}>
                              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-outline-variant/20 gap-4`}>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h3 className={`font-serif font-bold text-charcoal-text ${level === 0 ? 'text-2xl' : 'text-xl'}`}>{node.name}</h3>
                                    <span className="text-[10px] font-bold font-mono text-[#5a682f] bg-[#d6e7a0]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                      {nodeChildren.length} danh mục con
                                    </span>
                                  </div>
                                  {node.description && (
                                    <p className="text-sm text-on-surface-variant mt-1.5">{node.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenEditCategory(node.id)}
                                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-outline hover:text-botanical-green hover:bg-surface-container rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                                    title="Chỉnh sửa danh mục gốc"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteCategory(node)}
                                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-outline hover:text-error hover:bg-error-container/20 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                                    title="Xóa danh mục gốc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                                  </button>
                                </div>
                              </div>
                              
                              {renderCategoryTree(node.id, level + 1)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  return renderCategoryTree(null, 0);
                })()}
                <AdminPagination
                  currentPage={categoryPage}
                  totalItems={filteredRootCategories.length}
                  pageSize={adminPageSize}
                  onPageChange={setCategoryPage}
                  itemLabel="nhóm danh mục"
                />
              </div>
            </div>
          )}

          {/* ======================= TAB: ORCHIDS / KHO LAN ======================= */}
          {activeTab === 'orchids' && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản lý loài lan</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Thêm, chỉnh sửa và quản lý danh mục loài lan
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingOrchid(null); setOpenAddOrchid(true); }}
                    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-botanical-green px-4 py-2.5 font-sans text-xs font-semibold text-white transition-all hover:shadow"
                  >
                    <Plus className="h-4 w-4" /> Thêm loài lan mới
                  </button>
                </div>
              </div>

              {/* Classification Filters block */}
              <div className="space-y-3 rounded-lg border border-outline-variant/40 bg-white p-3 shadow-sm">
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(220px,360px)_210px_170px_auto_auto] xl:items-center xl:justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Tìm theo tên loài hoặc tên khoa học..."
                      className="h-9 w-full rounded-md border border-outline-variant bg-white pl-9 pr-3 text-[11px] text-charcoal-text outline-none transition-colors placeholder:text-outline focus:border-[#56642b] focus:ring-2 focus:ring-[#56642b]/10"
                    />
                  </div>

                  <CategoryTreeSelect
                    categories={orchidFilterCategories}
                    value={selectedCategoryFilter}
                    onChange={setSelectedCategoryFilter}
                    allLabel="Tất cả danh mục"
                    className="w-full"
                    triggerClassName="!h-9 !min-h-9 rounded-md text-[11px]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowOrchidAdvancedFilters((current) => !current)}
                    className={`flex h-9 items-center justify-between gap-2 rounded-md border px-2.5 text-[11px] transition-colors ${showOrchidAdvancedFilters ? 'border-[#56642b] bg-[#f7f8f1] text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]'}`}
                    aria-expanded={showOrchidAdvancedFilters}
                  >
                    <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" />Bộ lọc nâng cao</span>
                    <span className="flex items-center gap-2">
                      {orchidAdvancedFilterCount > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#667234] px-1.5 text-xs font-bold text-white">{orchidAdvancedFilterCount}</span>}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showOrchidAdvancedFilters ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  <div className="whitespace-nowrap text-xs text-outline xl:text-center" aria-live="polite">
                    {loadingAdminOrchids ? 'Đang tìm qua API...' : <>Tìm thấy <strong className="text-base text-[#56642b]">{filteredOrchids.length}</strong> loài lan</>}
                  </div>

                  <button
                    type="button"
                    onClick={clearOrchidFilters}
                    disabled={!hasOrchidFilters}
                    className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[11px] font-medium text-[#56642b] transition-colors hover:bg-[#56642b]/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" /> Xóa bộ lọc
                  </button>
                </div>

                {showOrchidAdvancedFilters && (
                  <div className="grid gap-6 rounded-xl border border-outline-variant/60 bg-[#fafbf8] p-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#434748]">Đặc tính</h4>
                      <div className="flex flex-wrap gap-2">
                        {ORCHID_FEATURE_FILTERS.map((feature) => {
                          const selected = selectedFeatureFilters.includes(feature.id);
                          return (
                            <button key={feature.id} type="button" onClick={() => setSelectedFeatureFilters((current) => selected ? current.filter((item) => item !== feature.id) : [...current, feature.id])} className={`rounded-md border px-3 py-2 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#eef1e2] font-semibold text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]'}`}>
                              {feature.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#434748]">Khu vực phân bố</h4>
                      <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                        {Object.entries(Region).map(([key, label]) => {
                          const selected = selectedRegionFilters.includes(key);
                          return <button key={key} type="button" onClick={() => setSelectedRegionFilters((current) => selected ? current.filter((item) => item !== key) : [...current, key])} className={`rounded-md border px-3 py-2 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#eef1e2] font-semibold text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]'}`}>{label}</button>;
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#434748]">Mùa hoa nở</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(BloomSeason).map(([key, label]) => {
                          const selected = selectedSeasonFilters.includes(key);
                          return <button key={key} type="button" onClick={() => setSelectedSeasonFilters((current) => selected ? current.filter((item) => item !== key) : [...current, key])} className={`rounded-md border px-3 py-2 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#eef1e2] font-semibold text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]'}`}>{label}</button>;
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#434748]">Màu sắc hoa</h4>
                      <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                        {Object.entries(FlowerColor).map(([key, color]) => {
                          const selected = selectedColorFilters.includes(key);
                          return (
                            <button key={key} type="button" onClick={() => setSelectedColorFilters((current) => selected ? current.filter((item) => item !== key) : [...current, key])} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#eef1e2] font-semibold text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]'}`}>
                              <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ backgroundColor: color }} />{ORCHID_COLOR_LABELS[key] ?? key}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {(selectedCategoryFilter || orchidAdvancedFilterCount > 0) && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/50 pt-4">
                    <span className="mr-1 text-sm text-outline">Đang lọc:</span>
                    {selectedCategoryFilter && (
                      <button type="button" onClick={() => setSelectedCategoryFilter('')} className="flex items-center gap-2 rounded-md border border-[#87905f]/40 bg-[#f7f8f1] px-3 py-2 text-xs font-medium text-[#56642b]">
                        {categories.find((category) => category.id === selectedCategoryFilter)?.name ?? 'Danh mục'} <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {selectedFeatureFilters.map((featureId) => (
                      <button key={featureId} type="button" onClick={() => setSelectedFeatureFilters((current) => current.filter((item) => item !== featureId))} className="flex items-center gap-2 rounded-md border border-[#87905f]/40 bg-[#f7f8f1] px-3 py-2 text-xs font-medium text-[#56642b]">
                        {ORCHID_FEATURE_FILTERS.find((feature) => feature.id === featureId)?.name} <X className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    {selectedRegionFilters.map((key) => <button key={key} type="button" onClick={() => setSelectedRegionFilters((current) => current.filter((item) => item !== key))} className="flex items-center gap-2 rounded-md border border-[#87905f]/40 bg-[#f7f8f1] px-3 py-2 text-xs font-medium text-[#56642b]">{Region[key as keyof typeof Region]} <X className="h-3.5 w-3.5" /></button>)}
                    {selectedSeasonFilters.map((key) => <button key={key} type="button" onClick={() => setSelectedSeasonFilters((current) => current.filter((item) => item !== key))} className="flex items-center gap-2 rounded-md border border-[#87905f]/40 bg-[#f7f8f1] px-3 py-2 text-xs font-medium text-[#56642b]">{BloomSeason[key as keyof typeof BloomSeason]} <X className="h-3.5 w-3.5" /></button>)}
                    {selectedColorFilters.map((key) => <button key={key} type="button" onClick={() => setSelectedColorFilters((current) => current.filter((item) => item !== key))} className="flex items-center gap-2 rounded-md border border-[#87905f]/40 bg-[#f7f8f1] px-3 py-2 text-xs font-medium text-[#56642b]"><span className="h-3 w-3 rounded-full border border-black/15" style={{ backgroundColor: FlowerColor[key as keyof typeof FlowerColor] }} />{ORCHID_COLOR_LABELS[key] ?? key} <X className="h-3.5 w-3.5" /></button>)}
                  </div>
                )}
              </div>

              {/* List of Specimen Section */}
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-serif text-xl font-bold text-on-surface">Danh sách loài lan <span className="ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#eef1e2] px-2 text-sm text-[#56642b]">{filteredOrchids.length}</span></h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-outline">Sắp xếp:</span>
                    <CategoryTreeSelect categories={ORCHID_SORT_OPTIONS} value={orchidSortOrder} onChange={setOrchidSortOrder} className="w-36" placeholder="Tên A–Z" />
                    <div className="flex items-center gap-1" role="group" aria-label="Kiểu hiển thị danh sách hoa lan">
                      <button
                        type="button"
                        onClick={() => setOrchidAdminViewMode('grid')}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${orchidAdminViewMode === 'grid' ? 'border-[#87905f]/50 bg-[#eef1e2] text-[#56642b]' : 'border-outline-variant bg-white text-outline hover:border-[#87905f]'}`}
                        aria-label="Hiển thị dạng lưới"
                        aria-pressed={orchidAdminViewMode === 'grid'}
                        title="Dạng lưới"
                      >
                        <Grid2X2 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrchidAdminViewMode('list')}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${orchidAdminViewMode === 'list' ? 'border-[#87905f]/50 bg-[#eef1e2] text-[#56642b]' : 'border-outline-variant bg-white text-outline hover:border-[#87905f]'}`}
                        aria-label="Hiển thị dạng danh sách"
                        aria-pressed={orchidAdminViewMode === 'list'}
                        title="Dạng danh sách"
                      >
                        <List className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 gap-6 ${orchidAdminViewMode === 'grid' ? 'md:grid-cols-2' : ''}`} aria-busy={loadingAdminOrchids}>
                  {!loadingAdminOrchids && !adminOrchidError && pagedOrchids.map((orc) => (
                    <div key={orc.id} className="bg-white p-4 rounded-xl border border-outline-variant/40 hover:border-botanical-green/40 duration-300 transition-all flex gap-4 group relative">
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container">
                        <img 
                          src={getOrchidImageUrls(orc)[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt={orc.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300";
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1 pr-14">
                            <h4 className="font-serif text-base font-bold text-on-surface truncate">{orc.name}</h4>
                            <span className="text-[9px] uppercase font-mono tracking-tighter bg-surface-container px-2 py-0.5 rounded text-outline">
                              {categories.find(c => c.id === orc.categoryIds[0])?.name || 'Chưa phân loại'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#56642b] italic font-semibold truncate leading-none mt-0.5">
                            {orc.englishName}
                          </p>
                          <p className="text-xs text-[#434748] mt-2 line-clamp-2 leading-relaxed">
                            {orc.shortDescription}
                          </p>
                        </div>
                        
                        <div className="flex items-center text-[10px] mt-2 pt-2 border-t border-[#f4f4f2] text-outline">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            orc.isPopular ? 'bg-[#d6e7a0]/30 text-[#56642b]' : 'bg-surface-container text-outline'
                          }`}>
                            {orc.isPopular ? 'Phổ biến' : 'Thông thường'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive hover administrative command tab */}
                      <div className="absolute right-4 bottom-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => orc.id && void handleOpenEditOrchid(orc.id)}
                          className="p-1.5 rounded-md bg-[#f4f4f2] hover:bg-botanical-green hover:text-white text-botanical-green transition-all"
                          title="Sửa thông số thực vật"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrchid(orc.id!, orc.name)}
                          className="p-1.5 rounded-md bg-error-container/40 hover:bg-error hover:text-white text-error transition-all"
                          title="Xóa bỏ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {loadingAdminOrchids && (
                    <div className="col-span-12 rounded-xl border border-outline-variant/40 bg-white p-12 text-center text-sm text-outline">
                      Đang tìm kiếm hoa lan từ API...
                    </div>
                  )}

                  {!loadingAdminOrchids && adminOrchidError && (
                    <div className="col-span-12 rounded-xl border border-red-200 bg-red-50 p-12 text-center text-sm text-red-600">
                      {adminOrchidError}
                    </div>
                  )}

                  {!loadingAdminOrchids && !adminOrchidError && filteredOrchids.length === 0 && (
                    <div className="col-span-12 p-12 text-center bg-white border border-dashed rounded-xl text-outline text-sm">
                      Không có loài lan nào khớp với từ khóa tìm kiếm hoặc tùy chọn lọc của bạn.
                    </div>
                  )}
                </div>
                <AdminPagination
                  currentPage={orchidPage}
                  totalItems={filteredOrchids.length}
                  pageSize={adminPageSize}
                  onPageChange={setOrchidPage}
                  itemLabel="loài lan"
                />
              </div>
            </div>
          )}

          {activeTab === 'document_categories' && (
            <DocumentCategoryManager
              categories={documentCategories}
              loading={loadingDocumentCategories}
              onCreate={handleCreateDocumentCategory}
              onUpdate={handleUpdateDocumentCategory}
              onDelete={handleDeleteDocumentCategory}
            />
          )}

          {/* ======================= TAB: 3. ARTICLES / QUẢN LÝ TÀI LIỆU ======================= */}
          {activeTab === 'articles' && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản Trị Tài Liệu Về Lan & Luồng Kiến Thức</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Soạn thảo, hiệu chỉnh và lập lịch xuất bản các công trình khảo cứu, cẩm nang chăm sóc hoa lan quy chuẩn.
                  </p>
                </div>
                {!showDocumentForm && (
                  <button
                    onClick={() => {
                      setEditingDocument(null);
                      setDocumentFile(null);
                      setDocumentForm({ title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '', categoryId: null });
                      setShowDocumentForm(true);
                    }}
                    className="px-5 py-2.5 bg-botanical-green text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow cursor-pointer flex gap-1.5 items-center"
                  >
                    <FilePlus className="w-4 h-4" /> Tải tài liệu mới
                  </button>
                )}
              </div>

              {showDocumentForm ? (
                <div className="min-h-[calc(100vh-230px)] flex items-center justify-center py-6">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white p-8 rounded-xl border border-outline-variant max-w-2xl space-y-6 shadow-sm"
                  >
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                    <h3 className="font-serif text-xl font-bold text-on-surface">
                      {editingDocument ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
                    </h3>
                    <button
                      onClick={handleCloseDocumentForm}
                      className="p-1 rounded-full text-outline hover:text-charcoal-text transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDocument} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tiêu đề tài liệu *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập tiêu đề tài liệu"
                        value={documentForm.title}
                        onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Danh mục tài liệu</label>
                      <InlineCategoryTreePicker
                        categories={documentCategories}
                        value={documentForm.categoryId ?? ''}
                        onChange={(categoryId) => setDocumentForm({ ...documentForm, categoryId: categoryId || null })}
                        allLabel="Không phân loại"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">
                        Tệp tài liệu {editingDocument ? '' : '*'}
                      </label>
                      {editingDocument ? (
                        <div className="min-h-24 border border-outline-variant rounded-lg flex items-center gap-3 px-5 py-4 bg-[#f7f8f2]">
                          <FileText className="w-7 h-7 shrink-0 text-[#56642b]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal-text">{editingDocument.originalName}</p>
                            <p className="mt-1 text-[10px] text-outline">Giữ nguyên tệp hiện tại khi chỉnh sửa thông tin.</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            id="document-file-upload"
                            type="file"
                            required
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                            className="sr-only"
                          />
                          <label
                            htmlFor="document-file-upload"
                            className="min-h-32 border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center gap-2 px-5 py-6 cursor-pointer hover:border-[#56642b] hover:bg-[#f7f8f2] transition-colors"
                          >
                            <FilePlus className="w-7 h-7 text-[#56642b]" />
                            <span className="text-sm font-semibold text-charcoal-text">
                              {documentFile ? documentFile.name : 'Chọn tệp từ máy tính'}
                            </span>
                            <span className="text-[10px] text-outline">
                              {documentFile
                                ? `${(documentFile.size / 1024 / 1024).toFixed(2)} MB`
                                : 'PDF, DOCX, XLSX, ZIP hoặc TXT'}
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Mô tả</label>
                      <textarea
                        placeholder="Nhập mô tả ngắn cho tài liệu"
                        value={documentForm.description}
                        onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green resize-none"
                      />
                    </div>
                    <div className="hidden">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên gốc (Original Name)</label>
                        <input
                          type="text"
                          value={documentForm.originalName}
                          onChange={(e) => setDocumentForm({ ...documentForm, originalName: e.target.value })}
                          className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Định dạng (Extension)</label>
                        <input
                          type="text"
                          placeholder="vd: .pdf, .docx"
                          value={documentForm.extension}
                          onChange={(e) => setDocumentForm({ ...documentForm, extension: e.target.value })}
                          className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Kích thước (Bytes)</label>
                        <input
                          type="number"
                          value={documentForm.sizeBytes}
                          onChange={(e) => setDocumentForm({ ...documentForm, sizeBytes: Number(e.target.value) })}
                          className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={uploadingDocument}
                        onClick={handleCloseDocumentForm}
                        className="px-4 py-2 border border-outline text-outline font-medium text-xs uppercase hover:bg-surface-container transition-all cursor-pointer disabled:opacity-60"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingDocument}
                        className="min-w-28 px-5 py-2 bg-botanical-green text-white font-medium text-xs uppercase hover:opacity-90 transition-all rounded cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                      >
                        {uploadingDocument
                          ? (editingDocument ? 'Đang lưu...' : 'Đang tải...')
                          : (editingDocument ? 'Lưu thay đổi' : 'Tải lên')}
                      </button>
                    </div>
                  </form>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-4">
                  {loadingDocuments ? (
                    <div className="text-center py-12 text-outline text-sm font-medium">Đang tải danh sách tài liệu...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documentsData?.items.map((doc) => (
                          <div key={doc.id} className="bg-white p-5 rounded-xl border border-outline-variant/40 hover:border-botanical-green/40 hover:shadow-md transition-all flex flex-col justify-between h-full group">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-mono font-bold uppercase rounded">
                                  {doc.extension || 'FILE'}
                                </span>
                                <span className="text-[10px] text-outline font-sans font-medium">
                                  {doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(1) + ' KB' : 'N/A'}
                                </span>
                              </div>
                              <h3 className="font-serif text-lg font-bold text-charcoal-text line-clamp-2 leading-tight group-hover:text-botanical-green transition-colors">
                                {doc.title}
                              </h3>
                              {doc.categoryName && (
                                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#667234]">
                                  {doc.categoryName}
                                </p>
                              )}
                              <p className="text-xs text-on-surface-variant leading-relaxed mt-2 line-clamp-3">
                                {doc.description || 'Không có mô tả cho tài liệu này.'}
                              </p>
                            </div>
                            
                            <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex items-center justify-between text-[11px]">
                              <div className="flex flex-col gap-0.5 text-[9px] text-outline font-mono">
                                <span>{doc.originalName || 'Unknown file name'}</span>
                                {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>}
                              </div>
                              <div className="flex gap-1">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-[#f4f4f2] text-botanical-green hover:bg-botanical-green hover:text-white transition-all cursor-pointer" title="Xem tài liệu">
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleOpenEditDocument(doc)}
                                  className="p-1.5 rounded-md bg-[#f4f4f2] text-botanical-green hover:bg-botanical-green hover:text-white transition-all cursor-pointer"
                                  title="Chỉnh sửa tài liệu"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1.5 rounded-md bg-error-container/40 text-error hover:bg-error hover:text-white transition-all cursor-pointer"
                                  title="Xóa tài liệu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!documentsData || documentsData.items.length === 0) && (
                          <div className="col-span-full p-12 text-center bg-white border border-dashed border-outline-variant rounded-xl text-outline text-sm font-medium">
                            Chưa có tài liệu nào trên hệ thống.
                          </div>
                        )}
                      </div>

                      {documentsData && (
                        <AdminPagination
                          currentPage={documentsData.pageNumber}
                          totalItems={documentsData.totalCount}
                          pageSize={documentsData.pageSize}
                          onPageChange={setDocPage}
                          itemLabel="tài liệu"
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: 4. USERS / NHÂN VIÊN ======================= */}
          {activeTab === 'users' && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản Lý Người Dùng</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Danh sách tài khoản được đồng bộ trực tiếp từ API Users.
                  </p>
                </div>
                <button
                  onClick={() => { setEditingUser(null); setOpenInviteAdmin(true); }}
                  className="px-5 py-2.5 bg-[#56642b] text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow cursor-pointer"
                >
                  Tạo người dùng mới
                </button>
              </div>

              {/* Administrators Table */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-outline-variant bg-[#f4f4f2]/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-serif text-lg font-bold text-on-surface">
                    Danh sách người dùng
                    <span className="ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#eef1e2] px-2 text-sm text-[#56642b]">{filteredUsers.length}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-outline">Sắp xếp:</span>
                    <CategoryTreeSelect
                      categories={ORCHID_SORT_OPTIONS}
                      value={userSortOrder}
                      onChange={setUserSortOrder}
                      className="w-36"
                      placeholder="Tên A–Z"
                    />
                    <div className="flex items-center gap-1" role="group" aria-label="Kiểu hiển thị người dùng">
                      <button
                        type="button"
                        onClick={() => setUserViewMode('grid')}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${userViewMode === 'grid' ? 'border-[#87905f]/50 bg-[#eef1e2] text-[#56642b]' : 'border-outline-variant bg-white text-outline hover:border-[#87905f]'}`}
                        aria-label="Hiển thị người dùng dạng lưới"
                        aria-pressed={userViewMode === 'grid'}
                        title="Dạng lưới"
                      >
                        <Grid2X2 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserViewMode('list')}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${userViewMode === 'list' ? 'border-[#87905f]/50 bg-[#eef1e2] text-[#56642b]' : 'border-outline-variant bg-white text-outline hover:border-[#87905f]'}`}
                        aria-label="Hiển thị người dùng dạng danh sách ngang"
                        aria-pressed={userViewMode === 'list'}
                        title="Dạng danh sách ngang"
                      >
                        <List className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="px-6 py-12 text-center text-sm text-outline">Đang tải người dùng...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-outline">Không có người dùng phù hợp.</div>
                ) : userViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {pagedUsers.map((user) => (
                      <div key={user.id} className="group flex min-w-0 items-center gap-4 rounded-xl border border-outline-variant/60 bg-white p-4 transition-all hover:border-[#87905f]/50 hover:shadow-sm">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="h-14 w-14 shrink-0 rounded-xl border border-outline-variant object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-soft-olive text-lg font-bold text-[#56642b]">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-charcoal-text">{user.fullName}</p>
                              <p className="mt-1 truncate text-xs text-[#434748]">{user.email}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button onClick={() => { setEditingUser(user); setOpenInviteAdmin(true); }} className="cursor-pointer rounded-md p-2 text-outline transition-all hover:bg-soft-olive/20 hover:text-botanical-green" title="Sửa người dùng"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => void handleDeleteUser(user)} disabled={user.email === currentUser} className="cursor-pointer rounded-md p-2 text-outline transition-all hover:bg-error-container/20 hover:text-error disabled:cursor-not-allowed disabled:opacity-35" title={user.email === currentUser ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa người dùng'}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {user.roleName && <span className="rounded bg-[#f1f3e7] px-2 py-1 text-[10px] font-semibold text-[#56642b]">{user.roleName}</span>}
                            {user.email === currentUser && <span className="rounded bg-[#56642b] px-2 py-1 text-[9px] font-bold text-white">ĐANG ĐĂNG NHẬP</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-outline-variant bg-[#f4f4f2] text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <tr><th className="px-6 py-2.5">Người dùng</th><th className="px-6 py-2.5">Email</th><th className="px-6 py-2.5">Vai trò</th><th className="px-6 py-2.5 text-right">Điều khiển</th></tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {pagedUsers.map((user) => (
                          <tr key={user.id} className="transition-colors hover:bg-gray-50/70">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="h-9 w-9 rounded-full border border-outline-variant object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-soft-olive font-bold text-[#56642b]">{user.fullName.charAt(0).toUpperCase()}</div>}
                                <div><p className="text-xs font-bold leading-none text-charcoal-text">{user.fullName}</p>{user.email === currentUser && <span className="mt-1 block text-[9px] font-bold text-botanical-green">ĐANG ĐĂNG NHẬP</span>}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#434748]">{user.email}</td>
                            <td className="px-6 py-4 text-[#434748]">{user.roleName || '—'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button onClick={() => { setEditingUser(user); setOpenInviteAdmin(true); }} className="cursor-pointer rounded p-1.5 text-outline transition-all hover:bg-soft-olive/20 hover:text-botanical-green" title="Sửa người dùng"><Edit className="h-3.5 w-3.5" /></button>
                                <button onClick={() => void handleDeleteUser(user)} disabled={user.email === currentUser} className="cursor-pointer rounded p-1 text-outline transition-all hover:bg-error-container/20 hover:text-error disabled:cursor-not-allowed disabled:opacity-35" title={user.email === currentUser ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa người dùng'}><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="border-t border-outline-variant/40 p-4">
                  <AdminPagination
                    currentPage={userPage}
                    totalItems={filteredUsers.length}
                    pageSize={adminPageSize}
                    onPageChange={setUserPage}
                    itemLabel="người dùng"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <AdminDiscussionManager
              searchQuery={searchQuery}
              notify={addToast}
            />
          )}

          {/* ======================= TAB: CULTIVATION CATEGORIES ======================= */}
          {activeTab === 'cultivation_cats' && (
            <ArticleCategoryManager
              section="cultivation"
              title="Danh Mục Cách Trồng & Chăm Sóc"
              categories={cultivationCategories}
              loading={loadingArticleCategories.cultivation}
              onReload={() => loadArticleCategories('cultivation')}
              notify={addToast}
            />
          )}

          {/* ======================= TAB: APPLICATION CATEGORIES ======================= */}
          {activeTab === 'application_cats' && (
            <ArticleCategoryManager
              section="application"
              title="Danh Mục Ứng Dụng"
              categories={applicationCategories}
              loading={loadingArticleCategories.application}
              onReload={() => loadArticleCategories('application')}
              notify={addToast}
            />
          )}

          {/* ======================= TAB: CARE GUIDE / TRỒNG & CHĂM SÓC (API) ======================= */}
          {(activeTab === 'care' || activeTab === 'applications') && (
            <div className="flex flex-1 flex-col gap-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">
                    {activeTab === 'applications' ? 'Ứng dụng' : 'Hướng dẫn trồng & chăm sóc'}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {activeTab === 'applications'
                      ? 'Biên soạn và quản lý các bài viết về ứng dụng của hoa lan trong đời sống.'
                      : 'Biên soạn và quản lý các hướng dẫn trồng, chăm sóc và bảo tồn hoa lan.'}
                  </p>
                </div>
                {!showCareArticleEditor && (
                  <button
                    onClick={() => {
                      setEditingCareArticle(null);
                      setCareArticleForm(emptyCareArticleForm);
                      setCareThumbnailPreviewUrl('');
                      setShowCareArticleEditor(true);
                    }}
                    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-botanical-green px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:shadow"
                  >
                    <FilePlus className="h-4 w-4" />
                    {activeTab === 'applications' ? 'Viết bài ứng dụng mới' : 'Viết hướng dẫn mới'}
                  </button>
                )}
              </div>

              {showCareArticleEditor ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-outline-variant max-w-4xl mx-auto space-y-5"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                    <h3 className="font-serif text-xl font-bold text-on-surface">
                      {editingCareArticle
                        ? (activeTab === 'applications' ? 'Cập nhật bài ứng dụng' : 'Cập nhật hướng dẫn')
                        : (activeTab === 'applications' ? 'Soạn bài ứng dụng mới' : 'Soạn thảo hướng dẫn mới')}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCareArticleEditor(false);
                        setCareThumbnailPreviewUrl('');
                      }}
                      disabled={uploadingCareThumbnail || savingCareArticle}
                      className="p-1 rounded-full text-outline hover:text-charcoal-text transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCareArticle} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tiêu đề hướng dẫn *</label>
                      <input
                        type="text"
                        value={careArticleForm.title}
                        onChange={(e) => setCareArticleForm({ ...careArticleForm, title: e.target.value })}
                        placeholder="Ví dụ: Kỹ thuật thay chậu cho lan Hồ Điệp..."
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Danh mục</label>
                      <InlineCategoryTreePicker
                        categories={currentArticleCategories}
                        value={careArticleForm.categoryId ?? ''}
                        onChange={(categoryId) => setCareArticleForm({ ...careArticleForm, categoryId })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tóm tắt</label>
                      <textarea
                        value={careArticleForm.summary}
                        onChange={(e) => setCareArticleForm({ ...careArticleForm, summary: e.target.value })}
                        rows={3}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-botanical-green resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Ảnh đại diện</label>
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-4 rounded-lg border border-outline-variant bg-[#f7f7f3] p-4">
                        <div className="h-32 overflow-hidden rounded-lg border border-outline-variant bg-white">
                          {careThumbnailPreviewUrl ? (
                            <img
                              src={careThumbnailPreviewUrl}
                              alt="Ảnh đại diện bài hướng dẫn"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : careArticleForm.thumbnailImageId ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-outline">
                              <ImageIcon className="h-7 w-7 text-botanical-green" />
                              <span className="text-[10px]">Ảnh đã được liên kết</span>
                            </div>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-outline">
                              <ImageIcon className="h-7 w-7" />
                              <span className="text-[10px]">Chưa có ảnh</span>
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-col justify-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-charcoal-text">Chọn ảnh từ máy tính</p>
                            <p className="mt-1 text-[10px] text-outline">JPG, PNG, WEBP hoặc GIF; tối đa 10 MB.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label className={`inline-flex items-center gap-2 rounded bg-botanical-green px-4 py-2 text-xs font-semibold text-white transition-opacity ${
                              uploadingCareThumbnail || savingCareArticle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'
                            }`}>
                              <Upload className="h-4 w-4" />
                              {uploadingCareThumbnail
                                ? 'Đang tải ảnh...'
                                : careArticleForm.thumbnailImageId
                                  ? 'Chọn ảnh khác'
                                  : 'Tải ảnh lên'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                disabled={uploadingCareThumbnail || savingCareArticle}
                                onChange={(event) => void handleUploadCareThumbnail(event)}
                                className="hidden"
                              />
                            </label>
                            {careArticleForm.thumbnailImageId && (
                              <button
                                type="button"
                                disabled={uploadingCareThumbnail || savingCareArticle}
                                onClick={() => {
                                  setCareArticleForm((current) => ({ ...current, thumbnailImageId: '' }));
                                  setCareThumbnailPreviewUrl('');
                                }}
                                className="rounded border border-error/40 px-4 py-2 text-xs font-semibold text-error hover:bg-error-container/30 disabled:opacity-50"
                              >
                                Gỡ ảnh
                              </button>
                            )}
                          </div>
                          {careArticleForm.thumbnailImageId && (
                            <p className="truncate font-mono text-[9px] text-outline" title={careArticleForm.thumbnailImageId}>
                              ID: {careArticleForm.thumbnailImageId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Hoa lan liên quan</label>
                          <span className="text-[10px] text-outline">Đã chọn {careArticleForm.orchidIds.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto bg-[#f4f4f2] border border-outline-variant rounded p-3 space-y-2">
                          {orchids.filter((orchid) => orchid.id).map((orchid) => (
                            <label key={orchid.id} className="flex items-center gap-2 text-sm text-charcoal-text cursor-pointer">
                              <input
                                type="checkbox"
                                checked={careArticleForm.orchidIds.includes(orchid.id!)}
                                onChange={(event) => setCareArticleForm({
                                  ...careArticleForm,
                                  orchidIds: event.target.checked
                                    ? [...careArticleForm.orchidIds, orchid.id!]
                                    : careArticleForm.orchidIds.filter((id) => id !== orchid.id),
                                })}
                              />
                              <span>{orchid.name}</span>
                            </label>
                          ))}
                          {orchids.every((orchid) => !orchid.id) && (
                            <p className="text-xs text-outline">Chưa có hoa lan từ API.</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tài liệu liên quan</label>
                          <span className="text-[10px] text-outline">Đã chọn {careArticleForm.documentIds.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto bg-[#f4f4f2] border border-outline-variant rounded p-3 space-y-2">
                          {careDocumentOptions.map((document) => document.id && (
                            <label key={document.id} className="flex items-start gap-2 text-sm text-charcoal-text cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={careArticleForm.documentIds.includes(document.id)}
                                onChange={(event) => setCareArticleForm({
                                  ...careArticleForm,
                                  documentIds: event.target.checked
                                    ? [...careArticleForm.documentIds, document.id!]
                                    : careArticleForm.documentIds.filter((id) => id !== document.id),
                                })}
                              />
                              <span>
                                <span className="block font-medium">{document.title}</span>
                                <span className="block text-[10px] text-outline">{document.originalName}</span>
                              </span>
                            </label>
                          ))}
                          {careDocumentOptions.length === 0 && (
                            <p className="text-xs text-outline">Chưa có tài liệu từ API.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Nội dung chi tiết *</label>
                      <LocalRichTextEditor
                        value={careArticleForm.content}
                        onChange={(content) => setCareArticleForm({ ...careArticleForm, content })}
                        minHeight={240}
                      />
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex justify-end gap-2">
                      <label className="mr-auto flex items-center gap-2 text-xs font-semibold text-on-surface-variant cursor-pointer">
                        <input
                          type="checkbox"
                          checked={careArticleForm.isPublished}
                          onChange={(e) => setCareArticleForm({ ...careArticleForm, isPublished: e.target.checked })}
                        />
                        Đã xuất bản
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCareArticleEditor(false);
                          setCareThumbnailPreviewUrl('');
                        }}
                        disabled={savingCareArticle || uploadingCareThumbnail}
                        className="px-4 py-2 border border-outline text-outline font-medium text-xs uppercase hover:bg-surface-container transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={savingCareArticle || uploadingCareThumbnail}
                        className="px-5 py-2 bg-botanical-green text-white font-medium text-xs uppercase hover:opacity-90 transition-all rounded cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploadingCareThumbnail
                          ? 'Đang tải ảnh...'
                          : savingCareArticle
                            ? 'Đang lưu...'
                            : (editingCareArticle ? 'Cập nhật' : 'Lưu bài viết')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <>
                  {loadingCareArticles ? (
                    <div className="flex items-center justify-center py-20 text-outline">
                      <div className="animate-spin w-8 h-8 border-4 border-botanical-green border-t-transparent rounded-full"></div>
                    </div>
                  ) : careArticles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-outline-variant bg-white py-14 text-center text-sm text-outline">
                      {activeTab === 'applications' ? 'Chưa có bài ứng dụng nào.' : 'Chưa có bài hướng dẫn nào.'}
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pagedCareArticles.map((art) => (
                        <div key={art.id} className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden flex items-stretch hover:shadow-md transition-all">
                          {(art.thumbnailImageUrl || getUploadedImageUrl(art.thumbnailImageId)) && (
                            <img
                              src={art.thumbnailImageUrl || getUploadedImageUrl(art.thumbnailImageId)}
                              alt={`Ảnh đại diện ${art.title}`}
                              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg m-4 mr-0 shrink-0 self-start"
                            />
                          )}
                          <div className="p-4 flex-1 min-w-0 flex flex-col">
                            <h3 className="font-serif text-lg font-bold text-on-surface line-clamp-2 leading-tight">
                              {art.title}
                            </h3>
                            <span className={`mt-2 w-fit px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              art.isPublished
                                ? 'bg-[#d6e7a0]/30 text-[#5a682f]'
                                : 'bg-surface-container text-outline'
                            }`}>
                              {art.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                            </span>
                            <p className="text-xs text-on-surface-variant leading-relaxed mt-2 line-clamp-3 flex-1">
                              {art.summary || art.content}
                            </p>
                            
                            <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex items-center justify-end gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => art.id && void handleOpenEditCareArticle(art.id)}
                                className="p-1.5 text-outline hover:text-botanical-green hover:bg-surface-container rounded transition-colors"
                                title="Chỉnh sửa bài viết"
                                aria-label={`Chỉnh sửa ${art.title}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => art.id && handleDeleteCareArticle(art.id)}
                                className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded transition-colors"
                                title="Xóa bài viết"
                                aria-label={`Xóa ${art.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                      <AdminPagination
                        currentPage={careArticlePage}
                        totalItems={careArticles.length}
                        pageSize={adminPageSize}
                        onPageChange={setCareArticlePage}
                        itemLabel={activeTab === 'applications' ? 'bài ứng dụng' : 'bài hướng dẫn'}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}



        </div>

        {/* Global Footer Section */}
        <footer className="mt-auto py-6 px-8 border-t border-[#c4c7c7] flex items-center text-xs text-on-surface-variant bg-white select-none">
          <div>
            © 2026 <strong>Orchids</strong>.
          </div>
        </footer>

      </main>

      {/* --- Overlay Modals Injection --- */}
      <AddOrchidModal
        isOpen={openAddOrchid}
        onClose={() => { setOpenAddOrchid(false); setEditingOrchid(null); }}
        categories={categories}
        onAddOrchid={handleAddNewOrchid}
        editOrchidData={editingOrchid}
        onEditOrchid={handleUpdateOrchid}
      />

      <AddCategoryModal
        isOpen={openAddCategory}
        onClose={() => { setOpenAddCategory(false); setEditingCategory(null); }}
        categories={categories}
        onAddCategory={handleAddCategory}
        editCategoryData={editingCategory}
        onEditCategory={handleUpdateCategory}
      />

      <ReportModal
        isOpen={openReport}
        onClose={() => setOpenReport(false)}
      />

      <DocUploadModal
        isOpen={openDocUpload}
        onClose={() => setOpenDocUpload(false)}
        onUploadSuccess={handleUploadDocumentSuccess}
      />

      <InviteAdminModal
        isOpen={openInviteAdmin}
        editUser={editingUser}
        onClose={() => { setOpenInviteAdmin(false); setEditingUser(null); }}
        onSave={handleSaveUser}
      />

      <ReplyModal
        question={replyTargetQuestion}
        onClose={() => setReplyTargetQuestion(null)}
        onSubmitReply={handleReplyQuestion}
      />

      <ModerationModal
        isOpen={openModerationModal}
        onClose={() => setOpenModerationModal(false)}
        report={selectedPendingPost}
        onIgnore={handleApprovePost}
        onWarn={() => {}}
        onBan={handleRejectPost}
      />

      </div>
      )}

          {screen === 'discussion' && <Discussion isAdmin={currentSessionIsAdmin} />}
          {screen === 'planting_and_care' && <PlantingAndCare isAdmin={currentSessionIsAdmin} />}
          {screen === 'applications' && <Applications isAdmin={currentSessionIsAdmin} />}
          {screen === 'document' && <DocumentPage isAdmin={currentSessionIsAdmin} />}
          {screen === 'profile' && <CustomerProfile />}

      {screen === 'list_orchids' && currentSessionIsAdmin && (
        <>
          <AddOrchidModal
            isOpen={openAddOrchid}
            onClose={() => { setOpenAddOrchid(false); setEditingOrchid(null); }}
            categories={categories}
            onAddOrchid={handleAddNewOrchid}
            editOrchidData={editingOrchid}
            onEditOrchid={handleUpdateOrchid}
          />
          <AddCategoryModal
            isOpen={openAddCategory}
            onClose={() => { setOpenAddCategory(false); setEditingCategory(null); }}
            categories={categories}
            onAddCategory={handleAddCategory}
            editCategoryData={editingCategory}
            onEditCategory={handleUpdateCategory}
          />
        </>
      )}

      {/* Global notifications for login, signup and dashboard screens. */}
      {confirmDialog}
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
