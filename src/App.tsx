/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import CustomerHome from './pages/CustomerHome';
import Discussion from './pages/Discussion';
import PlantingAndCare from './pages/PlantingAndCare';
import DocumentPage from './pages/Document';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Users,
  LogOut,
  Menu,
  Search,
  Bell,
  Settings,
  Plus,
  FilePlus,
  TrendingUp,
  Calendar,
  ChevronRight,
  Sparkles,
  UserPlus,
  Edit,
  Trash2,
  X,
  Check,
  Send,
  Eye,
  EyeOff,
  Filter,
  Layers,
  HelpCircle,
  FileText,
  ThumbsUp,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Domain Imports
import { Orchid, Question, Category, CommunityPost, CareArticle, PaginatedDocuments, DocumentItem } from './types';
import { login, loginWithGoogle, refreshAuthToken, getCategories, createCategory, getArticles, createArticle, updateArticle, deleteArticle, getOrchids, createOrchid, updateOrchid, deleteOrchid, getDocuments, createDocument, deleteDocument, type LoginResponse } from './services/api';
import {
  INITIAL_ORCHIDS,
  INITIAL_QUESTIONS,
  INITIAL_ARTICLES,
  INITIAL_CATEGORIES,
  INITIAL_COMMUNITY_POSTS
} from './data';

// Subcomponent Imports
import { Toasts, useToasts } from './components/Toasts';
import { ReportModal } from './components/ReportModal';
import { DocUploadModal } from './components/DocUploadModal';
import { InviteAdminModal } from './components/InviteAdminModal';
import { ReplyModal } from './components/ReplyModal';
import { AddOrchidModal, AddCategoryModal } from './components/OrchidForms';
import { ModerationModal } from './components/ModerationModal';
import ListOrchids from './pages/ListOrchids';
import OrchidDetail from './pages/OrchidDetail';
import GoogleLoginButton from './components/GoogleLoginButton';

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

export default function App() {
  const { toasts, addToast, removeToast } = useToasts();

  
  type ScreenType = "home" | "signup" | "login" | "forgot_password" | "dashboard" | "discussion" | "planting_and_care" | "document" | "list_orchids" | "orchid_detail";

  const getInitialScreen = (): ScreenType => {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot_password' || path === '/forgot-password') return 'forgot_password';
    if (path === '/admin/dashboard' || path === '/dashboard') return 'dashboard';
    if (path === '/discussion') return 'discussion';
    if (path === '/planting-and-care') return 'planting_and_care';
    if (path === '/document') return 'document';
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const setScreen = (newScreen: ScreenType, id?: string) => {
    setScreenState(newScreen);
    let path = '/';
    if (newScreen === 'login') path = '/login';
    else if (newScreen === 'signup') path = '/signup';
    else if (newScreen === 'forgot_password') path = '/forgot_password';
    else if (newScreen === 'dashboard') path = '/admin/dashboard';
    else if (newScreen === 'discussion') path = '/discussion';
    else if (newScreen === 'planting_and_care') path = '/planting-and-care';
    else if (newScreen === 'document') path = '/document';
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
      const storedUser = localStorage.getItem("orchidee_admin_user")
        || sessionStorage.getItem("orchidee_admin_user");

      if (nextScreen === "dashboard" && !storedUser) {
        window.history.replaceState({}, '', '/login');
        setScreenState("login");
        return;
      }

      setScreenState(nextScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

        const refreshedSession = await refreshAuthToken({
          token,
          refreshToken: storedRefreshToken,
        });
        if (!isActive) return;

        const refreshedToken = refreshedSession.accessToken || refreshedSession.token || token;
        const mergedSession: LoginResponse = {
          ...session,
          ...refreshedSession,
          token: refreshedSession.token || session.token,
          accessToken: refreshedSession.accessToken || session.accessToken,
          refreshToken: refreshedSession.refreshToken || storedRefreshToken,
        };

        storage.setItem("orchidee_auth", JSON.stringify(mergedSession));
        storage.setItem("orchidee_auth_token", refreshedToken);
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
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("orchidee_remembered_email")));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("orchidee_admin_user")
      || sessionStorage.getItem("orchidee_admin_user");
    if (storedUser) {
      setCurrentUser(storedUser);
      setScreen("dashboard");
    } else if (getInitialScreen() === "dashboard") {
      window.history.replaceState({}, '', '/login');
      setScreenState("login");
    }
  }, []);

  const handleSignUp = (e: React.FormEvent) => {
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
    
    localStorage.setItem("orchidee_admin_user", email);
    setCurrentUser(email);
    setScreen("dashboard");
    addToast("Đăng ký thành công!", "success");
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

      localStorage.removeItem("orchidee_admin_user");
      sessionStorage.removeItem("orchidee_admin_user");
      storage.setItem("orchidee_admin_user", normalizedEmail);
      storage.setItem("orchidee_auth", JSON.stringify(authData));

      if (rememberMe) {
        localStorage.setItem("orchidee_remembered_email", normalizedEmail);
      } else {
        localStorage.removeItem("orchidee_remembered_email");
      }

      if (token) {
        storage.setItem("orchidee_auth_token", token);
      }

      setCurrentUser(normalizedEmail);
      setPassword("");
      setScreen("dashboard");
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

      localStorage.removeItem("orchidee_admin_user");
      localStorage.removeItem("orchidee_auth");
      localStorage.removeItem("orchidee_auth_token");
      sessionStorage.removeItem("orchidee_admin_user");
      sessionStorage.removeItem("orchidee_auth");
      sessionStorage.removeItem("orchidee_auth_token");

      storage.setItem("orchidee_admin_user", googleEmail);
      storage.setItem("orchidee_auth", JSON.stringify(authData));
      if (token) storage.setItem("orchidee_auth_token", token);

      setCurrentUser(googleEmail);
      setScreen("dashboard");
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
  const [loadingOrchids, setLoadingOrchids] = useState(false);

  const loadOrchids = async () => {
    setLoadingOrchids(true);
    try {
      const data = await getOrchids();
      setOrchids(data);
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
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [docPage, setDocPage] = useState(1);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState<Omit<DocumentItem, 'id' | 'createdAt'>>({
    title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: ''
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

  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'orchids' | 'articles' | 'users' | 'community' | 'care'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (activeTab === 'articles') {
      loadDocuments(docPage);
    }
  }, [activeTab, docPage]);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ol_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (screen !== 'dashboard') return;

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
  }, [addToast, screen]);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('ol_community_posts');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  // Reports state removed, we now use communityPosts for post moderation

  // --- Administrators list ---
  const [admins, setAdmins] = useState(() => {
    const defaultAdmins = [
      { id: 'adm-1', name: 'Ngô Chí Tài', email: 'tai.nguyen@orchideeluxe.com', role: 'Quản trị tối cao (Super Admin)', status: 'Đang hoạt động', date: '12-05-2024' },
      { id: 'adm-2', name: 'Nguyễn Văn Đạt', email: 'dat.nv@orchideeluxe.com', role: 'Biên tập viên (Editor)', status: 'Đang hoạt động', date: '18-09-2024' },
      { id: 'adm-3', name: 'Lê Diệu Vy', email: 'vydieu@orchideeluxe.com', role: 'Nhà nghiên cứu (Researcher)', status: 'Ngoại tuyến', date: '01-02-2025' }
    ];
    const saved = localStorage.getItem('ol_admins');
    return saved ? JSON.parse(saved) : defaultAdmins;
  });

  // System Notifications state
  const [notifications, setNotifications] = useState([
    { id: 'n-1', text: 'Minh Anh gửi câu hỏi Cattleya', time: '10 phút trước', read: false },
    { id: 'n-2', text: '5 tài liệu khoa học cần được duyệt lưu trữ', time: '1 giờ trước', read: false },
    { id: 'n-3', text: 'Báo cáo xu hướng thị trường 2026 sẵn sàng', time: '1 ngày trước', read: true }
  ]);

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem('ol_questions', JSON.stringify(questions));
  }, [questions]);


  useEffect(() => {
    localStorage.setItem('ol_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('ol_community_posts', JSON.stringify(communityPosts));
    } catch (e) {
      console.warn('Lỗi lưu trữ bài viết (có thể do ảnh quá lớn):', e);
    }
  }, [communityPosts]);

  // ol_reports effect removed

  useEffect(() => {
    localStorage.setItem('ol_admins', JSON.stringify(admins));
  }, [admins]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  // --- Modals State ---
  const [openAddOrchid, setOpenAddOrchid] = useState(false);
  const [editingOrchid, setEditingOrchid] = useState<Orchid | null>(null);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [openDocUpload, setOpenDocUpload] = useState(false);
  const [openInviteAdmin, setOpenInviteAdmin] = useState(false);
  const [replyTargetQuestion, setReplyTargetQuestion] = useState<Question | null>(null);

  // old articles state removed

  // --- Care Guide state (API) ---
  const [careArticles, setCareArticles] = useState<CareArticle[]>([]);
  const [loadingCareArticles, setLoadingCareArticles] = useState(false);
  const [showCareArticleEditor, setShowCareArticleEditor] = useState(false);
  const [editingCareArticle, setEditingCareArticle] = useState<CareArticle | null>(null);
  const [careArticleForm, setCareArticleForm] = useState({ title: '', content: '', imageUrl: '' });

  useEffect(() => {
    if (activeTab === 'care') {
      loadCareArticles();
    }
  }, [activeTab]);

  const loadCareArticles = async () => {
    setLoadingCareArticles(true);
    try {
      const data = await getArticles();
      setCareArticles(data);
    } catch (error) {
      addToast('Không thể tải danh sách cách trồng và chăm sóc', 'error');
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

    try {
      if (editingCareArticle && editingCareArticle.id) {
        await updateArticle(editingCareArticle.id, careArticleForm);
        addToast('Cập nhật thành công', 'success');
      } else {
        await createArticle(careArticleForm);
        addToast('Thêm mới thành công', 'success');
      }
      setShowCareArticleEditor(false);
      setEditingCareArticle(null);
      setCareArticleForm({ title: '', content: '', imageUrl: '' });
      loadCareArticles();
    } catch (error) {
      addToast('Có lỗi xảy ra khi lưu', 'error');
    }
  };

  const handleDeleteCareArticle = async (id: string | number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài hướng dẫn này?')) return;
    try {
      await deleteArticle(id);
      addToast('Xóa thành công', 'info');
      loadCareArticles();
    } catch (error) {
      addToast('Có lỗi xảy ra khi xóa', 'error');
    }
  };

  // --- Community state ---
  const [activeCommunitySubTab, setActiveCommunitySubTab] = useState<'feed' | 'moderation'>('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Moderation Modal state ---
  const [openModerationModal, setOpenModerationModal] = useState(false);
  const [selectedPendingPost, setSelectedPendingPost] = useState<CommunityPost | null>(null);

  // --- Toast notifications mechanism ---
  // --- Orchid Tab Search & Filter States ---
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedFeatureFilter, setSelectedFeatureFilter] = useState('All');

  const handleCreatePost = (e: React.FormEvent) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleToggleLike = (postId: string) => {
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

  const handleAddComment = (postId: string, e: React.FormEvent) => {
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
      const newOrchidData = {
        ...orchidPayload,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      await createOrchid(newOrchidData);
      
      // update count in categories locally
      setCategories(prevCats => prevCats.map(cat => {
        if (orchidPayload.categoryIds.includes(cat.id)) {
          return { ...cat, orchidCount: cat.orchidCount + 1 };
        }
        return cat;
      }));
      
      addToast(`Thêm loài lan thành công: ${orchidPayload.name}`, 'success');
      loadOrchids();
    } catch (error) {
      addToast('Lỗi hệ thống: Không thể thêm loài lan', 'error');
    }
  };

  const handleUpdateOrchid = async (id: string, updated: Omit<Orchid, 'id' | 'createdAt'>) => {
    try {
      await updateOrchid(id, updated);
      addToast(`Đã lưu thay đổi cho loài: ${updated.name}`, 'success');
      setEditingOrchid(null);
      loadOrchids();
    } catch (error) {
      addToast('Lỗi hệ thống: Không thể cập nhật loài lan', 'error');
    }
  };

  const handleDeleteOrchid = async (id: string, name: string) => {
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
    } catch (error) {
      addToast('Lỗi hệ thống: Không thể xóa loài lan', 'error');
    }
  };

  const handleReplyQuestion = (qId: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, replied: true, replyContent: text, repliedBy: 'Ngô Chí Tài' } : q));
    addToast(`Đã trả lời câu hỏi trực tiếp`, 'success');
  };

  const handleAddCategory = async (payload: Omit<Category, 'id' | 'orchidCount'>) => {
    const slug = payload.slug || payload.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    try {
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

  const handleUploadDocumentSuccess = (filename: string) => {
    addToast(`Lưu trữ tài liệu thành công: "${filename}"`, 'success');
    // auto append a system notification too
    setNotifications(prev => [
      { id: `sys-${Date.now()}`, text: `Tập tin ${filename} được tải lên lưu trữ`, time: 'Vừa xong', read: false },
      ...prev
    ]);
  };

  const handleInviteAdminSuccess = (name: string, role: string, email: string) => {
    const newAd = {
      id: `adm-${Date.now()}`,
      name,
      email,
      role,
      status: 'Chờ phản hồi',
      date: new Date().toLocaleDateString('vi-VN')
    };
    setAdmins((prev: any[]) => [...prev, newAd]);
    addToast(`Mời cộng tác viên thành công: ${name}`, 'success');
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.title.trim() || !documentForm.url.trim()) {
      addToast('Vui lòng nhập Tiêu đề và URL của tài liệu', 'error');
      return;
    }

    try {
      await createDocument(documentForm);
      addToast('Tải lên tài liệu thành công', 'success');
      setShowDocumentForm(false);
      setDocumentForm({ title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '' });
      loadDocuments(docPage);
    } catch (error) {
      addToast('Có lỗi xảy ra khi tải lên tài liệu', 'error');
    }
  };

  const handleDeleteDocument = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await deleteDocument(id);
      addToast('Đã xóa tài liệu', 'info');
      loadDocuments(docPage);
    } catch (error) {
      addToast('Lỗi khi xóa tài liệu', 'error');
    }
  };


  const deleteAdmin = (id: string, name: string) => {
    setAdmins((prev: any[]) => prev.filter((a: any) => a.id !== id));
    addToast(`Đã thu hồi đặc quyền của ${name}`, 'info');
  };

  // Notification clear
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Filtering & Sorting ---
  const filteredOrchids = orchids.filter(orc => {
    const matchesSearch = orc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          orc.englishName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'All' || 
                       orc.categoryIds.some(id => categories.find(c => c.id === id)?.name === selectedCategoryFilter);
    const matchesFeature = selectedFeatureFilter === 'All' || 
                           (selectedFeatureFilter === 'Popular' && orc.isPopular) || 
                           (selectedFeatureFilter === 'Fragrant' && orc.hasFragrance);
    return matchesSearch && matchesCat && matchesFeature;
  });

  // filteredArticles removed

  const filteredCategories = categories.filter(cat => {
    return cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (cat.scientificName && cat.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredAdmins = admins.filter((admin: any) => {
    return admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           admin.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unansweredCount = questions.filter(q => !q.replied).length;

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b] font-sans transition-colors duration-300">

      {/* =================== SCREEN 0: HOME =================== */}
      {screen === "home" && <CustomerHome onNavigate={(s, id) => setScreen(s as any, id)} />}

      {screen === "list_orchids" && <ListOrchids categoryId={selectedCategoryId} onNavigate={(s, id) => setScreen(s as any, id)} />}
      
      {screen === "orchid_detail" && selectedOrchidId && <OrchidDetail id={selectedOrchidId} onNavigate={(s, id) => setScreen(s as any, id)} />}

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
                    Tôi đã đọc và đồng ý với{" "}
                    <a href="#" className="underline font-medium hover:text-[#56642b]">Điều khoản dịch vụ</a>
                    {" "}&{" "}
                    <a href="#" className="underline font-medium hover:text-[#56642b]">Chính sách bảo mật</a>.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  id="btn_submit_signup"
                  type="submit"
                  className="w-full py-2.5 bg-[#56642b] hover:bg-[#3f4b1e] text-white rounded-[2px] font-semibold text-[11px] tracking-wider uppercase text-center cursor-pointer transition-all duration-300 shadow-sm"
                >
                  ĐĂNG KÝ
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
                <GoogleLoginButton onCredential={handleGoogleLogin} disabled={isLoggingIn} />
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
              <button onClick={() => setScreen("home")} className="font-serif text-[32px] tracking-wide font-normal text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Poetic quote block at absolute bottom-right corner */}
            <div className="absolute bottom-12 right-12 left-12 max-w-lg ml-auto text-right space-y-3 z-20">
              <p className="font-serif italic text-white text-2xl lg:text-[28px] font-light leading-relaxed tracking-wide drop-shadow-md">
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
              <button onClick={() => setScreen("home")} className="font-serif text-[32px] tracking-wide font-normal text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Caption on the left-hand bottom-left as requested in prompt screenshot */}
            <div className="absolute bottom-12 left-12 right-12 max-w-md text-left space-y-3 z-20">
              <p className="font-serif text-white text-3xl lg:text-[36px] font-normal leading-relaxed tracking-wide drop-shadow-md">
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
                    autoComplete={rememberMe ? "email" : "off"}
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
                    autoComplete={rememberMe ? "current-password" : "off"}
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
                    <span>Ghi nhớ mật khẩu</span>
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
              <button onClick={() => setScreen("home")} className="font-serif text-[32px] tracking-wide font-normal text-white cursor-pointer hover:opacity-90 transition-opacity">Orchids</button>
            </div>

            {/* Caption on the left-hand bottom-left as requested in prompt screenshot */}
            <div className="absolute bottom-12 left-12 right-12 max-w-md text-left space-y-3 z-20">
              <p className="font-serif text-white text-3xl lg:text-[36px] font-normal leading-relaxed tracking-wide drop-shadow-md">
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
      <aside className={`w-64 border-r border-[#c4c7c7] fixed h-screen left-0 top-0 bg-[#f9f9f7] flex flex-col z-40 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-8">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#56642b] flex items-center gap-2">
            Orchids
          </h1>
          <p className="text-[10px] text-outline tracking-widest mt-0.5 font-mono uppercase">
            HỆ THỐNG QUẢN TRỊ
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'overview'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">Tổng quan</span>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'categories'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FolderKanban className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">Chi Danh mục</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('orchids'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'orchids'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Layers className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">Quản lý Hoa Lan</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {orchids.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('articles'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'articles'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">QUẢN LÝ TÀI LIỆU VỀ LAN</span>
            <span className="ml-auto text-[10px] font-mono bg-[#56642b]/10 text-[#5a682f] px-2 py-0.5 rounded font-bold">
              {documentsData?.totalCount || 0}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('care'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'care'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">TRỒNG & CHĂM SÓC</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`flex items-center gap-3 px-4 py-3 w-full transition-all duration-300 rounded text-left ${
              activeTab === 'users'
                ? 'text-[#56642b] border-r-2 border-[#56642b] font-bold bg-[#d6e7a1]/20'
                : 'text-[#434748] hover:text-[#56642b] hover:bg-[#d6e7a1]/20'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">Người dùng</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-outline font-bold">
              {admins.length}
            </span>
          </button>

        </nav>

        {/* Footer-styled administrator profile context */}
        <div className="p-4 mt-auto border-t border-[#c4c7c7]">
          <div className="relative">
            <button 
              onClick={() => setShowProfileCard(!showProfileCard)}
              className="flex items-center gap-3 w-full text-left p-1.5 hover:bg-surface-container rounded-lg transition-all"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAo-zJ5ExvYhdfmT23_95dB29dmK652EZRN7py72zTdPmJLHqMDmewFwJvl83ED4Wb0uI6mbOboycJo43rGQ_koStqSWySSt9as1MkMo0cmCif0aLAYQK7XNmK0cTie3UXY5qCroUIWsSP8mte2PjEIWdFQUfvfE6sw6Zqpt6DIUpB5p5CFKSEl2_xkReYMvAGfU5_NlH6SVhq6qB04Kob_AYkqptH0emAvVEq9bD5OtBbxzFwaUk8-2kKfqzbwUX5d_190ppkVoU3-"
                className="w-8 h-8 rounded-full border border-antique-gold/20 object-cover"
                alt="Ngô Chí Tài"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface truncate leading-tight">Ngô Chí Tài</p>
                <p className="text-[9px] text-[#56642b] font-semibold tracking-wider font-mono">SUPER ADMIN</p>
              </div>
            </button>

            <AnimatePresence>
              {showProfileCard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-12 left-0 right-0 bg-white p-4 rounded-xl shadow-xl border border-outline-variant z-50 text-xs space-y-2"
                >
                  <p className="font-bold text-on-surface">Vùng làm việc: VIỆT NAM</p>
                  <p className="text-outline">Cơ sở dữ liệu: Orchids Registry Hub</p>
                  <p className="text-outline font-mono">Phiên bản thiết bị: v4.2.14</p>
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
            className="flex w-full items-center gap-3 px-4 py-2 mt-3 text-error hover:bg-error/10 transition-all duration-300 rounded text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold font-sans">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        
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
                    <p className="text-[10px] uppercase font-bold tracking-wider text-outline px-1">Gợi ý tìm kiếm</p>
                    
                    {filteredOrchids.slice(0, 3).map((orc) => (
                      <button
                        key={orc.id}
                        onMouseDown={() => {
                          setSearchQuery(orc.name);
                          setShowSearchOverlay(false);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-surface-container rounded w-full text-left transition-colors"
                      >
                        <img src={orc.uploadedImageIds[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"} className="w-6 h-6 rounded object-cover" alt="" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold">{orc.name}</p>
                          <p className="text-[10px] text-outline italic">{orc.englishName}</p>
                        </div>
                      </button>
                    ))}

                    {filteredOrchids.length === 0 && (
                      <div className="p-2 text-center text-outline text-[11px]">
                        Không tìm thấy loài lan phù hợp.
                      </div>
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
                <p className="font-label-md text-xs font-bold text-on-surface leading-snug">Ngô Chí Tài</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Quản trị viên</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#e2e3e1] overflow-hidden border border-[#c4c7c7] shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAo-zJ5ExvYhdfmT23_95dB29dmK652EZRN7py72zTdPmJLHqMDmewFwJvl83ED4Wb0uI6mbOboycJo43rGQ_koStqSWySSt9as1MkMo0cmCif0aLAYQK7XNmK0cTie3UXY5qCroUIWsSP8mte2PjEIWdFQUfvfE6sw6Zqpt6DIUpB5p5CFKSEl2_xkReYMvAGfU5_NlH6SVhq6qB04Kob_AYkqptH0emAvVEq9bD5OtBbxzFwaUk8-2kKfqzbwUX5d_190ppkVoU3-"
                  className="w-full h-full object-cover"
                  alt="Ngô Chí Tài"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <div className="flex-1 p-8 pb-12">
          
          {/* ======================= TAB: 1. OVERVIEW ======================= */}
          {activeTab === 'overview' && (
            <div className="space-y-10">
              {/* Top Title Bar & Call to Action Buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-on-surface">
                    Tổng quan Hệ thống
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Chào mừng trở lại, Ngô Chí Tài. Đây là dữ liệu mới nhất hôm nay.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setOpenAddCategory(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#56642b] text-white rounded-lg font-sans text-xs font-semibold uppercase tracking-wider hover:shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> THÊM DANH MỤC
                  </button>
                  <button
                    onClick={() => { setActiveTab('articles'); setShowDocumentForm(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-antique-gold text-antique-gold rounded-lg font-sans text-xs font-semibold uppercase tracking-wider hover:bg-surface-container transition-all shrink-0 cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4" /> QUẢN LÝ TÀI LIỆU VỀ LAN
                  </button>
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
                  <h3 className="text-3xl font-serif text-botanical-green font-bold mt-2">{1248 + orchids.length - 4}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-secondary font-medium">
                    <TrendingUp className="w-4 h-4 text-botanical-green" />
                    <span>+12% từ tháng trước</span>
                  </div>
                </div>

                {/* Stat 2: Articles */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">TÀI LIỆU VỀ LAN</p>
                  <h3 className="text-3xl font-serif text-[#56642b] font-bold mt-2">{documentsData?.totalCount || 0}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-secondary font-medium">
                    <Calendar className="w-4 h-4 text-[#56642b]" />
                    <span>{(documentsData?.totalCount || 0)} tài liệu tháng này</span>
                  </div>
                </div>

                {/* Stat 3: Questions answered */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider font-sans">Câu hỏi Q&A chưa trả lời</p>
                  <h3 className="text-3xl font-serif text-[#ba1a1a] font-bold mt-2">{unansweredCount}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-outline">
                    <Check className="w-4 h-4 text-[#56642b]" />
                    <span>Đã giải đáp {questions.filter(q=>q.replied).length}/{questions.length} hệ thống</span>
                  </div>
                </div>

                {/* Stat 4: Admins counting */}
                <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30 relative overflow-hidden group">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Cộng tác viên hoạt động</p>
                  <h3 className="text-3xl font-serif text-antique-gold font-bold mt-2">{admins.length}</h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-antique-gold">
                    <Sparkles className="w-4 h-4 text-antique-gold" />
                    <span>Tải dữ liệu an toàn cao</span>
                  </div>
                </div>
              </div>

              {/* Main Data Grid (8:4 layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Q&A Panel (8/12 width) */}
                <div className="lg:col-span-8 bg-white border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-[#f4f4f2]/50">
                    <div>
                      <h4 className="font-serif text-lg font-semibold text-on-surface">
                        Câu hỏi Q&A mới nhất cần phản hồi
                      </h4>
                      <p className="text-[11px] text-outline mt-0.5">Tương tác trực diện với mạng lưới khách hàng cao cấp</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f4f4f2] text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                        <tr>
                          <th className="px-6 py-2.5">Người gửi</th>
                          <th className="px-6 py-2.5">Nội dung câu hỏi ngắn</th>
                          <th className="px-6 py-2.5">Thời gian</th>
                          <th className="px-6 py-2.5 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {questions.map((q) => (
                          <tr key={q.id} className="hover:bg-[#f4f4f2]/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold leading-none ${q.avatarColor}`}>
                                  {q.avatarLetter}
                                </div>
                                <span className="font-semibold text-charcoal-text">{q.sender}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-[#434748] font-medium">
                              {q.content}
                              {q.replied && (
                                <div className="text-[10px] text-secondary mt-1 flex items-center gap-1 font-semibold">
                                  <Check className="w-3.5 h-3.5" /> Đã trả lời: "{q.replyContent}"
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-outline font-mono">{q.timeAgo}</td>
                            <td className="px-6 py-4 text-right">
                              {q.replied ? (
                                <span className="text-[10px] bg-secondary/10 text-on-secondary-container px-2.5 py-1 rounded font-bold font-sans">
                                  ĐÃ PHẢN HỒI
                                </span>
                              ) : (
                                <button
                                  onClick={() => setReplyTargetQuestion(q)}
                                  className="px-3.5 py-1.5 bg-[#56642b]/15 text-[#56642b] rounded hover:bg-[#56642b] hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider font-sans cursor-pointer"
                                >
                                  Trả lời ngay
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 border-t border-outline-variant/50 flex justify-center bg-gray-50">
                    <span className="text-[11px] text-outline">
                      Các câu hỏi trên được đồng bộ trực tuyến từ đơn đăng ký dịch vụ Orchids.
                    </span>
                  </div>
                </div>

                {/* Right Column Layout (4/12 width) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Quick Actions Panel */}
                  <div className="bg-white p-6 luxury-shadow rounded-xl border border-outline-variant/30">
                    <h4 className="font-serif text-lg font-semibold text-on-surface mb-4">
                      Thao tác nhanh
                    </h4>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => { setActiveTab('community'); setSearchQuery(''); }}
                        className="flex items-center justify-between p-3 w-full bg-[#f4f4f2] hover:bg-[#d6e7a1]/20 rounded-lg group transition-all text-left border border-transparent hover:border-[#56642b]/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-white rounded text-secondary shadow-sm">
                            <MessageSquare className="w-4 h-4 text-botanical-green" />
                          </span>
                          <div>
                            <p className="font-bold text-xs text-on-surface">Đăng bài Cộng đồng</p>
                            <p className="text-[10px] text-outline font-mono">Chia sẻ trạng thái, hình ảnh</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => setOpenInviteAdmin(true)}
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
                                src={orc.uploadedImageIds[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"}
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
                                onClick={() => { setEditingOrchid(orc); setOpenAddOrchid(true); }}
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản Lý Danh Mục</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Danh sách tổng hợp các nhóm giống lan tơ cổ điển và lan đặc chủng rừng tự nhiên Việt Nam.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenAddCategory(true)}
                    className="px-4 py-2 bg-botanical-green text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow transition-all shrink-0 cursor-pointer"
                  >
                    Tạo danh mục mới
                  </button>
                </div>
              </div>

              {/* Category Grid Section */}
              <div className="space-y-4">
                {loadingCategories && (
                  <p className="py-8 text-center text-sm text-on-surface-variant">
                    Đang tải danh mục từ máy chủ...
                  </p>
                )}
                {!loadingCategories && filteredCategories.length === 0 && (
                  <p className="py-8 text-center text-sm text-on-surface-variant">
                    Chưa có danh mục nào.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCategories.map((cat) => (
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
                      
                      <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex justify-between items-center">
                        <span className="text-[9px] text-[#735c00] font-sans font-semibold tracking-wider">HỒ SƠ BẢO TRỢ</span>
                        <button
                          onClick={() => {
                            setSelectedCategoryFilter(cat.name);
                            setActiveTab('orchids');
                            addToast(`Đang lọc hiển thị đơn loài thuộc ${cat.name}`, 'info');
                          }}
                          className="text-[10px] text-secondary font-bold font-sans hover:underline cursor-pointer"
                        >
                          Xem đơn loài →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: ORCHIDS / KHO LAN ======================= */}
          {activeTab === 'orchids' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản Lý Hoa Lan</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Cơ sở dữ liệu chi tiết các loài lan, quản lý tình trạng bảo tồn và đặc tính.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingOrchid(null); setOpenAddOrchid(true); }}
                    className="px-4 py-2 bg-botanical-green text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow transition-all shrink-0 cursor-pointer"
                  >
                    Thêm loài lan mới
                  </button>
                </div>
              </div>

              {/* Classification Filters block */}
              <div className="bg-white p-4 rounded-xl border border-outline-variant/40 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-1.5 text-xs text-outline">
                    <Filter className="w-4 h-4" />
                    <span className="font-sans font-medium">Lọc theo:</span>
                  </div>
                  
                  {/* Category choices */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-[#f4f4f2] text-xs text-charcoal-text border border-outline-variant rounded px-2.2 py-1 focus:outline-none"
                  >
                    <option value="All">Tất cả danh mục chi</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>

                  {/* Feature choices */}
                  <select
                    value={selectedFeatureFilter}
                    onChange={(e) => setSelectedFeatureFilter(e.target.value)}
                    className="bg-[#f4f4f2] text-xs text-charcoal-text border border-outline-variant rounded px-2.2 py-1 focus:outline-none"
                  >
                    <option value="All">Tất cả đặc tính</option>
                    <option value="Popular">Lan Phổ Biến</option>
                    <option value="Fragrant">Có Hương Thơm</option>
                  </select>
                </div>

                <div className="text-xs text-outline font-sans">
                  Tìm thấy <strong>{filteredOrchids.length}</strong> cá thể lan
                </div>
              </div>

              {/* List of Specimen Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl font-bold text-on-surface">Toàn bộ danh tính mầm lan mẫu ({filteredOrchids.length})</h3>
                  {selectedCategoryFilter !== 'All' && (
                    <button 
                      onClick={() => setSelectedCategoryFilter('All')}
                      className="text-xs text-[#56642b] font-medium underline"
                    >
                      Bỏ lọc phân mục
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredOrchids.map((orc) => (
                    <div key={orc.id} className="bg-white p-4 rounded-xl border border-outline-variant/40 hover:border-botanical-green/40 duration-300 transition-all flex gap-4 group relative">
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container">
                        <img 
                          src={orc.uploadedImageIds[0] || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=300"} 
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
                        
                        <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-[#f4f4f2] text-outline">
                          <span>Thứ tự: {orc.displayOrder}</span>
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
                          onClick={() => { setEditingOrchid(orc); setOpenAddOrchid(true); }}
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

                  {filteredOrchids.length === 0 && (
                    <div className="col-span-12 p-12 text-center bg-white border border-dashed rounded-xl text-outline text-sm">
                      Không có loài lan nào khớp với từ khóa tìm kiếm hoặc tùy chọn lọc của bạn.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: 3. ARTICLES / QUẢN LÝ TÀI LIỆU ======================= */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
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
                      setDocumentForm({ title: '', description: '', originalName: '', extension: '', sizeBytes: 0, url: '' });
                      setShowDocumentForm(true);
                    }}
                    className="px-5 py-2.5 bg-botanical-green text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow cursor-pointer flex gap-1.5 items-center"
                  >
                    <FilePlus className="w-4 h-4" /> Tải tài liệu mới
                  </button>
                )}
              </div>

              {showDocumentForm ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-outline-variant max-w-3xl mx-auto space-y-5"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                    <h3 className="font-serif text-xl font-bold text-on-surface">
                      Thêm tài liệu mới
                    </h3>
                    <button
                      onClick={() => setShowDocumentForm(false)}
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
                        value={documentForm.title}
                        onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">URL / Link File *</label>
                      <input
                        type="url"
                        required
                        value={documentForm.url}
                        onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Mô tả</label>
                      <textarea
                        value={documentForm.description}
                        onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
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
                        onClick={() => setShowDocumentForm(false)}
                        className="px-4 py-2 border border-outline text-outline font-medium text-xs uppercase hover:bg-surface-container transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-botanical-green text-white font-medium text-xs uppercase hover:opacity-90 transition-all rounded cursor-pointer"
                      >
                        Tải lên
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <div className="space-y-4">
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

                      {/* Pagination Controls */}
                      {documentsData && (documentsData.totalPages > 1) && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <button
                            disabled={!documentsData.hasPreviousPage}
                            onClick={() => setDocPage(prev => Math.max(1, prev - 1))}
                            className="px-4 py-2 bg-white border border-outline-variant text-[#56642b] rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-all cursor-pointer"
                          >
                            Trang trước
                          </button>
                          <span className="text-xs font-mono font-bold text-on-surface bg-surface-container px-3 py-1.5 rounded">
                            {documentsData.pageNumber} / {documentsData.totalPages}
                          </span>
                          <button
                            disabled={!documentsData.hasNextPage}
                            onClick={() => setDocPage(prev => prev + 1)}
                            className="px-4 py-2 bg-white border border-outline-variant text-[#56642b] rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-all cursor-pointer"
                          >
                            Trang sau
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: 4. USERS / NHÂN VIÊN ======================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Mạng Lưới Cộng Tác Viên & Học Giả</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Cung cấp phân quyền chỉnh sửa cơ sở dữ liệu, quản lý tài liệu lưu trữ, và điều trị bảo tồn thực vật.
                  </p>
                </div>
                <button
                  onClick={() => setOpenInviteAdmin(true)}
                  className="px-5 py-2.5 bg-[#56642b] text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow cursor-pointer"
                >
                  Mời cộng tác viên mới
                </button>
              </div>

              {/* Administrators Table */}
              <div className="bg-white rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-[#f4f4f2]/50 border-b border-outline-variant">
                  <h3 className="font-serif text-lg font-bold text-on-surface">Danh sách nhân sự được cấp quyền</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f4f4f2] text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                      <tr>
                        <th className="px-6 py-2.5">Cộng tác viên</th>
                        <th className="px-6 py-2.5">Hòm thư điện tử</th>
                        <th className="px-6 py-2.5">Phân cấp vai trò</th>
                        <th className="px-6 py-2.5">Trạng thái bảo mật</th>
                        <th className="px-6 py-2.5 text-right">Điều khiển</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {filteredAdmins.map((ad: any) => (
                        <tr key={ad.id} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-soft-olive flex items-center justify-center font-bold text-[#56642b]">
                                {ad.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-charcoal-text text-xs leading-none">{ad.name}</p>
                                <span className="text-[10px] text-outline font-mono block mt-1">Gia nhập: {ad.date}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-[#434748]">{ad.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-antique-gold/10 text-antique-gold font-bold text-[9px] rounded uppercase font-sans">
                              {ad.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[9px] font-sans ${
                              ad.status === 'Đang hoạt động' ? 'bg-[#d6e7a0]/40 text-[#5a682f]' : 'bg-antique-gold/10 text-antique-gold'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                ad.status === 'Đang hoạt động' ? 'bg-[#56642b]' : 'bg-antique-gold animate-pulse'
                              }`} />
                              {ad.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {ad.id === 'adm-1' ? (
                              <span className="text-[10px] text-outline italic pr-2 font-mono">Tài khoản hiện đang đăng nhập</span>
                            ) : (
                              <button
                                onClick={() => deleteAdmin(ad.id, ad.name)}
                                className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-all cursor-pointer"
                                title="Thu hồi đặc quyền"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: CARE GUIDE / TRỒNG & CHĂM SÓC (API) ======================= */}
          {activeTab === 'care' && (
            <div className="flex-1 p-8 pb-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-on-surface">Hướng Dẫn Trồng & Chăm Sóc</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Cơ sở dữ liệu lưu trữ các kỹ thuật chăm sóc, nhân giống và bảo tồn hoa lan (Dữ liệu API).
                  </p>
                </div>
                {!showCareArticleEditor && (
                  <button
                    onClick={() => {
                      setEditingCareArticle(null);
                      setCareArticleForm({ title: '', content: '', imageUrl: '' });
                      setShowCareArticleEditor(true);
                    }}
                    className="px-5 py-2.5 bg-botanical-green text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow cursor-pointer"
                  >
                    Viết hướng dẫn mới
                  </button>
                )}
              </div>

              {showCareArticleEditor ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-outline-variant max-w-3xl mx-auto space-y-5"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                    <h3 className="font-serif text-xl font-bold text-on-surface">
                      {editingCareArticle ? 'Cập nhật hướng dẫn' : 'Soạn thảo hướng dẫn mới'}
                    </h3>
                    <button
                      onClick={() => setShowCareArticleEditor(false)}
                      className="p-1 rounded-full text-outline hover:text-charcoal-text transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCareArticle} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tiêu đề hướng dẫn</label>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Liên kết ảnh minh họa (URL)</label>
                      <input
                        type="url"
                        value={careArticleForm.imageUrl}
                        onChange={(e) => setCareArticleForm({ ...careArticleForm, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
                      />
                      {careArticleForm.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-outline-variant bg-surface-container h-40 max-w-md">
                          <img src={careArticleForm.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Nội dung chi tiết</label>
                      <textarea
                        value={careArticleForm.content}
                        onChange={(e) => setCareArticleForm({ ...careArticleForm, content: e.target.value })}
                        rows={10}
                        placeholder="Nhập nội dung kỹ thuật chi tiết..."
                        className="w-full bg-[#f4f4f2] border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-botanical-green resize-none leading-relaxed"
                        required
                      />
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCareArticleEditor(false)}
                        className="px-4 py-2 border border-outline text-outline font-medium text-xs uppercase hover:bg-surface-container transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-botanical-green text-white font-medium text-xs uppercase hover:opacity-90 transition-all rounded cursor-pointer"
                      >
                        {editingCareArticle ? 'Cập nhật' : 'Xuất bản'}
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
                    <div className="text-center py-16 bg-white rounded-xl border border-outline-variant/30">
                      <div className="w-16 h-16 bg-[#d6e7a1]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#56642b]">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Chưa có bài hướng dẫn nào</h3>
                      <p className="text-sm text-outline max-w-md mx-auto">
                        Hãy bắt đầu viết các bài hướng dẫn kỹ thuật trồng và chăm sóc hoa lan để chia sẻ với cộng đồng.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {careArticles.map((art) => (
                        <div key={art.id} className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden flex flex-col hover:shadow-md transition-all">
                          {art.imageUrl && (
                            <div className="h-48 w-full bg-surface-container overflow-hidden">
                              <img src={art.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-serif text-lg font-bold text-on-surface line-clamp-2 leading-tight">
                              {art.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed mt-2 line-clamp-3 flex-1">
                              {art.content}
                            </p>
                            
                            <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCareArticle(art);
                                  setCareArticleForm({ title: art.title, content: art.content, imageUrl: art.imageUrl || '' });
                                  setShowCareArticleEditor(true);
                                }}
                                className="p-1.5 px-3 bg-soft-olive text-[#5a682f] border border-secondary/15 rounded hover:bg-secondary hover:text-white transition-all font-bold text-[10px] uppercase font-sans cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => art.id && handleDeleteCareArticle(art.id)}
                                className="p-1.5 px-3 rounded bg-[#ffdad6] text-error hover:bg-error hover:text-white transition-all font-bold text-[10px] uppercase cursor-pointer"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}



        </div>

        {/* Global Footer Section */}
        <footer className="mt-auto py-6 px-8 border-t border-[#c4c7c7] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant bg-white select-none">
          <div>
            © 2026 <strong>Orchids</strong>. Hệ thống Quản trị Bảo tồn Thực vật cao cấp.
          </div>
          <div className="flex gap-5">
            <a href="#" onClick={(e) => { e.preventDefault(); addToast('Đang chuyển hướng tới chính sách bảo mật...', 'info'); }} className="hover:text-[#56642b] transition-colors">Chính sách Bảo mật</a>
            <a href="#" onClick={(e) => { e.preventDefault(); addToast('Đang tải điều khoản sử dụng...', 'info'); }} className="hover:text-[#56642b] transition-colors">Điều khoản Sử dụng</a>
            <a href="#" onClick={(e) => { e.preventDefault(); addToast('Đóng gói logs gửi bộ phận kỹ thuật...', 'success'); }} className="hover:text-[#56642b] transition-colors">Liên hệ Kỹ thuật</a>
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
        onClose={() => setOpenAddCategory(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
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
        onClose={() => setOpenInviteAdmin(false)}
        onInviteSuccess={handleInviteAdminSuccess}
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

          {screen === 'discussion' && <Discussion />}
          {screen === 'planting_and_care' && <PlantingAndCare />}
          {screen === 'document' && <DocumentPage />}

      {/* Global notifications for login, signup and dashboard screens. */}
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
