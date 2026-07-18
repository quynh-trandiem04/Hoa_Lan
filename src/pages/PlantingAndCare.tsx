import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Send,
  Plus,
  CheckCircle2,
  Bookmark,
  Share2,
  Heart,
  Droplet,
  Sun,
  Flame,
  Leaf,
  Sparkles,
  Award,
  Globe2,
  FileText
} from "lucide-react";
import { OrchidCareArticle as Article, ChatMessage } from "../types";
import { CARE_ARTICLES as INITIAL_ARTICLES, CARE_CATEGORIES as CATEGORIES, HIGHLIGHTED_STATIONERY_QUOTES } from "../data";
import SearchModal from "../components/SearchModal";
import { getArticles } from "../services/api";

export default function PlantingAndCare() {
  // Navigation tabs: 'care' (default), 'find', 'docs'
  const [activeTab, setActiveTab] = useState<"care" | "find" | "docs">("care");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Articles & filtering state
  const [articles, setArticles] = useState<Article[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả bài viết");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Search box state (upper bar vs sidebar)
  const [upperSearchOpen, setUpperSearchOpen] = useState(false);
  const [upperSearchQuery, setUpperSearchQuery] = useState("");

  // Login Modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ email: "", name: "" });

  // Share Article Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Article["category"]>("Kỹ thuật");
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImgUrl, setNewImgUrl] = useState("https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p");

  // Floating Chat Assistant state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("orchidee_luxe_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default greeting
      }
    }
    return [
      {
        id: "welcome",
        sender: "bot",
        text: "Kính chào quý nghệ nhân yêu lan. Tôi là cố vấn dưỡng lan ảo của Orchidée Luxe. Bạn có câu hỏi nào về cách tưới tiêu, bón phân hay khắc phục các bệnh lý cho nhành phong lan quý của mình không?",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Daily Checklist tracker state
  const [dailyTasks, setDailyTasks] = useState([
    { id: "task-1", text: "Kiểm tra độ ẩm rễ Lan Hồ Điệp (màu xám bạc)", done: false, type: "water" },
    { id: "task-2", text: "Phun nước gạo/dịch chuối loãng cho Lan Vũ Nữ", done: false, type: "nutrition" },
    { id: "task-3", text: "Cắt nước giò Dendrobium đứng ngọn kích hoa", done: false, type: "flower" },
    { id: "task-4", text: "Vệ sinh bẹ lá Cattleya đề phòng nấm thối đen", done: false, type: "safety" }
  ]);

  // Hearts / Likes storage
  const [likedArticles, setLikedArticles] = useState<string[]>(() => {
    const saved = localStorage.getItem("orchidee_luxe_likes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    let isActive = true;
    const loadPublishedArticles = async () => {
      try {
        const apiArticles = await getArticles({
          isPublished: true,
          pageNumber: 1,
          pageSize: 100,
          sortBy: "title",
          sortDescending: false,
        });
        if (!isActive) return;
        setArticles(apiArticles.map((article, index) => ({
          id: article.id ?? article.slug,
          category: "Kỹ thuật",
          title: article.title,
          author: "Ban biên tập Orchids",
          date: "",
          description: article.summary,
          content: article.content,
          imageUrl: INITIAL_ARTICLES[index % Math.max(INITIAL_ARTICLES.length, 1)]?.imageUrl ?? "",
          featured: index === 0,
          comments: [],
        })));
      } catch (error) {
        console.error("Không thể tải bài viết đã xuất bản:", error);
        if (isActive) setArticles([]);
      }
    };
    void loadPublishedArticles();
    return () => {
      isActive = false;
    };
  }, []);

  // Save user-specific state on key hooks
  useEffect(() => {
    localStorage.setItem("orchidee_luxe_chat", JSON.stringify(chatMessages));
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("orchidee_luxe_likes", JSON.stringify(likedArticles));
  }, [likedArticles]);

  // Combined real-time article filter
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "Tất cả bài viết" ||
      (selectedCategory === "Kỹ thuật tưới nước" && article.category === "Kỹ thuật") ||
      (selectedCategory === "Bón phân & Dinh dưỡng" && article.category === "Dinh dưỡng") ||
      (selectedCategory === "Phòng trừ sâu bệnh" && article.category === "Phòng bệnh") ||
      (selectedCategory === "Kích hoa nở" && article.category === "Mẹo vặt");

    const searchStr = (searchQuery || upperSearchQuery).toLowerCase();
    const matchesSearch =
      article.title.toLowerCase().includes(searchStr) ||
      article.description.toLowerCase().includes(searchStr) ||
      article.content.toLowerCase().includes(searchStr);

    return matchesCategory && matchesSearch;
  });

  // Calculate paginated results
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArticles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  // Botanical checklist toggle
  const toggleTask = (id: string) => {
    setDailyTasks(
      dailyTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Calculation for progress percentage
  const checklistProgress = Math.round(
    (dailyTasks.filter((t) => t.done).length / dailyTasks.length) * 100
  );

  // Article Like feature toggle
  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedArticles.includes(id)) {
      setLikedArticles(likedArticles.filter((x) => x !== id));
    } else {
      setLikedArticles([...likedArticles, id]);
    }
  };

  // Submit article share form
  const handleShareArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !newDesc || !newAuthor) {
      alert("Quý nghệ nhân vui lòng điền đầy đủ các thông tin bài viết.");
      return;
    }

    const newArticle: Article = {
      id: `art-custom-${Date.now()}`,
      category: newCategory,
      title: newTitle,
      author: newAuthor,
      date: new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      description: newDesc,
      content: newContent,
      imageUrl: newImgUrl,
      featured: false
    };

    setArticles([newArticle, ...articles]);
    setIsShareModalOpen(false);
    // Reset state fields
    setNewTitle("");
    setNewAuthor("");
    setNewDesc("");
    setNewContent("");
    alert("Cảm ơn quý nghệ nhân! Bài viết chia sẻ kinh nghiệm đã được đăng tải thành công vào cẩm nang.");
  };

  // Submit message to AI Chat Assistant
  const handleSendMessage = async (e?: React.FormEvent, seedText?: string) => {
    if (e) e.preventDefault();
    const query = seedText || chatMessageInput;
    if (!query.trim()) return;

    if (!seedText) {
      setChatMessageInput("");
    }

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: updatedHistory.slice(-6) // Send recent dialogue history context
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `msg-b-${Date.now()}`,
        sender: "bot",
        text: data.text || "Đã xảy ra lỗi khi trao đổi với cố vấn. Quý khách vui lòng thử lại.",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg-b-err-${Date.now()}`,
        sender: "bot",
        text: "Hệ thống kết nối cố vấn tạm thời chập chờn. Xin lỗi quý nghệ nhân vì trải nghiệm bất tiện này.",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setSelectedArticle(null);
  };

  // Fake credentials process
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.email) return;
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface-cream text-charcoal-text selection:bg-soft-olive selection:text-secondary-hover font-sans relative">
      
      {/* 1. Header Navigation Bar */}
            <header className="sticky top-0 w-full z-40 h-16 bg-surface-cream/95 backdrop-blur-md border-b border-[#56642b]/10 shadow-sm">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto h-full">
          <div className="font-serif italic text-xl md:text-2xl text-[#56642b] font-bold tracking-tight select-none">
            Orchids
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors">
              Trang Chủ
            </a>
            <div className="relative group">
              <button className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors flex items-center gap-1 cursor-pointer">
                DANH MỤC LAN
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-3.5 h-3.5 rotate-90" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
              </button>
              <div className="absolute top-full left-0 w-64 bg-surface-cream border border-[#747878]/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-3 mt-2 rounded">
                <ul className="flex flex-col">
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Rừng Tự Nhiên (Dendrobium)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Đột Biến (Phalaenopsis)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Hồ Điệp (Phalaenopsis)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Cattleya (Cattleya)</button></li>
                </ul>
              </div>
            </div>
            <a href="/planting-and-care" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#56642b] border-b-2 border-[#56642b] pb-1 transition-all cursor-pointer">
              Cách trồng và chăm sóc
            </a>
            <a href="/document" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Tài liệu
            </a>
            <a href="/discussion" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Thảo luận
            </a>
          </div>
          <div className="flex items-center space-x-5">
            <button onClick={() => setIsSearchModalOpen(true)} className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Tìm kiếm loài lan">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
            </button>
            <button onClick={() => window.location.href = '/login'} className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Trang quản lý hồ sơ">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-5 h-5" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          </div>
        </div>
      </header>

      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        onNavigate={(screen, id) => {
          if (screen === 'orchid_detail' && id) window.location.href = `/orchids/${id}`;
          else if (screen === 'list_orchids') window.location.href = '/list-orchids';
          else if (screen === 'home') window.location.href = '/';
        }}
      />

      {/* Main Tab System Rendering */}
      {activeTab === "care" && (
        <>

          {/* 4. Main Content Divided Grid Wrapper */}
          <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 md:py-20">
            <div className="flex flex-col lg:flex-row gap-12">
              
              {/* Sidebar Panel (Left Column) */}
              <aside className="w-full lg:w-1/4 space-y-12">
                
                {/* Search field widget */}
                <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-secondary font-bold">
                    Tìm kiếm bài viết
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nhập từ khóa..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-200 bg-surface-cream rounded-[2px] text-sm py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                    />
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Categories filtering list */}
                <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm space-y-5">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-secondary font-bold">
                    Danh mục chăm sóc
                  </h3>
                  <div className="flex flex-col gap-3">
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryClick(cat)}
                          className={`text-left text-sm py-1 font-sans transition-all flex items-center justify-between ${
                            isActive
                              ? "text-secondary font-semibold border-l-2 border-antique-gold pl-3"
                              : "text-gray-500 hover:text-secondary pl-0"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] font-mono text-gray-300">
                            ({articles.filter(a => {
                              if (cat === "Tất cả bài viết") return true;
                              if (cat === "Kỹ thuật tưới nước") return a.category === "Kỹ thuật";
                              if (cat === "Bón phân & Dinh dưỡng") return a.category === "Dinh dưỡng";
                              if (cat === "Phòng trừ sâu bệnh") return a.category === "Phòng bệnh";
                              if (cat === "Kích hoa nở") return a.category === "Mẹo vặt";
                              return false;
                            }).length})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Daily Checklist Tool Widget */}
                <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-antique-gold" /> Nhật ký hôm nay
                    </h3>
                    <span className="text-xs font-mono font-semibold text-secondary">
                      {checklistProgress}%
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${checklistProgress}%` }}
                    />
                  </div>

                  <div className="space-y-4">
                    {dailyTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-start gap-2.5 cursor-pointer group"
                      >
                        <div className={`mt-0.5 rounded-full border flex items-center justify-center transition-all ${
                          task.done
                            ? "bg-secondary border-secondary text-white w-4.5 h-4.5"
                            : "border-gray-300 group-hover:border-secondary w-4.5 h-4.5"
                        }`}>
                          {task.done && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className={`text-xs text-justify leading-tight select-none transition-all ${
                          task.done ? "line-through text-gray-300" : "text-gray-600 group-hover:text-charcoal-text"
                        }`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {checklistProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-soft-olive/40 p-3 rounded-[2px] text-center"
                    >
                      <p className="text-[11px] text-secondary-hover font-medium flex items-center justify-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Tuyệt vời! Bạn chăm lan rất chu đáo.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Featured/Popular Articles Widget */}
                <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm space-y-6">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-secondary font-bold">
                    Bài viết nổi bật
                  </h3>
                  <div className="space-y-6">
                    {articles.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="group flex gap-4 items-center cursor-pointer"
                        onClick={() => setSelectedArticle(item)}
                      >
                        <div className="w-14 h-14 shrink-0 overflow-hidden rounded-[2px] border border-gray-100 bg-gray-50">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-sans text-xs font-semibold text-gray-700 leading-snug group-hover:text-antique-gold transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stationery/Philosophy Quote Card */}
                <div className="bg-secondary/5 p-6 border border-secondary/15 rounded-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-5 text-secondary">
                    <BookOpen className="w-32 h-32" />
                  </div>
                  <p className="font-serif italic text-xs leading-relaxed text-secondary-hover select-none">
                    "{HIGHLIGHTED_STATIONERY_QUOTES[0]}"
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-antique-gold mt-4 font-semibold">
                    Triết lý Orchids
                  </p>
                </div>

              </aside>

              {/* Feed Grid Section (Right-hand Column) */}
              <section className="w-full lg:w-3/4">
                
                <AnimatePresence mode="wait">
                  {selectedArticle ? (
                    // 5a. Gorgeous article reading panel
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white p-6 md:p-12 border border-gray-100 rounded-sm shadow-sm space-y-8"
                    >
                      {/* Back handle banner */}
                      <button
                        onClick={() => {
                          setSelectedArticle(null);
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-secondary group transition-colors focus:outline-none"
                      >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Quay lại danh sách
                      </button>

                      {/* Header metadata segment */}
                      <div className="space-y-4">
                        <span className="bg-secondary text-white font-mono text-[10px] px-3 py-1 uppercase tracking-wider rounded-[2px]">
                          {selectedArticle.category}
                        </span>
                        <h2 className="font-serif text-2xl md:text-4xl text-charcoal-text font-medium leading-tight">
                          {selectedArticle.title}
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> By {selectedArticle.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedArticle.date}</span>
                        </div>
                      </div>

                      {/* Large premium photo */}
                      <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden rounded-[2px] border border-gray-100 relative">
                        <img
                          src={selectedArticle.imageUrl}
                          alt={selectedArticle.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute right-3 bottom-3 bg-black/50 text-[9px] font-mono text-white/80 px-2 py-0.5 rounded backdrop-blur-sm select-none">
                          Orchidée Luxe Photographic Collection
                        </div>
                      </div>

                      {/* Editorial markdown styled body content */}
                      <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-secondary prose-p:text-gray-600 prose-p:leading-relaxed text-justify space-y-6">
                        {selectedArticle.content.split("\n\n").map((para, i) => {
                          if (para.startsWith("## ")) {
                            return (
                              <h3 key={i} className="font-serif text-lg md:text-xl text-secondary pt-4 font-bold border-b border-gray-100 pb-2">
                                {para.replace("## ", "")}
                              </h3>
                            );
                          }
                          if (para.startsWith("### ")) {
                            return (
                              <h4 key={i} className="font-serif text-base md:text-lg text-antique-gold font-medium pt-3">
                                {para.replace("### ", "")}
                              </h4>
                            );
                          }
                          if (para.startsWith("- **")) {
                            // Render nice premium list elements
                            return (
                              <div key={i} className="space-y-2.5 my-3 pl-2">
                                {para.split("\n").map((line, idx) => {
                                  const text = line.replace("- **", "").replace("**", "");
                                  const titlePart = text.split(":")[0];
                                  const bodyPart = text.split(":")[1] || "";
                                  return (
                                    <div key={idx} className="flex items-start gap-2.5 text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-antique-gold mt-2 shrink-0" />
                                      <p className="text-gray-600 leading-relaxed text-justify">
                                        <strong className="text-charcoal-text font-medium">{titlePart}</strong>: {bodyPart}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-sm md:text-base text-gray-600 leading-relaxed text-justify">
                              {para}
                            </p>
                          );
                        })}
                      </article>

                      {/* Footer interaction bar */}
                      <div className="pt-8 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleLike(selectedArticle.id, e)}
                            className={`flex items-center gap-1.5 text-xs font-mono px-4 py-2 border transition-all rounded-[2px] ${
                              likedArticles.includes(selectedArticle.id)
                                ? "bg-red-50 text-red-500 border-red-200"
                                : "text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-200"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${likedArticles.includes(selectedArticle.id) ? "fill-red-500" : ""}`} /> Thích ({likedArticles.includes(selectedArticle.id) ? 1 : 0})
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert("Đã sao chép liên kết bài viết vào khay nhớ tạm!");
                            }}
                            className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-secondary px-4 py-2 border border-gray-200 rounded-[2px]"
                          >
                            <Share2 className="w-4 h-4" /> Chia sẻ
                          </button>
                        </div>

                        {/* Comment Trigger Button */}
                        <button
                          onClick={() => {
                            document.getElementById('comment-input')?.focus();
                          }}
                          className="flex items-center gap-1.5 text-xs font-mono text-antique-gold hover:text-white hover:bg-antique-gold transition-all border border-antique-gold px-4 py-2 rounded-[2px]"
                        >
                          <MessageSquare className="w-4 h-4" /> Bình luận
                        </button>
                      </div>

                      {/* Comments Section */}
                      <div className="mt-16 border-t border-gray-200 pt-12">
                        <h3 className="font-serif text-xl md:text-2xl text-secondary font-medium tracking-tight mb-8">Bình luận dưới bài viết</h3>
                        
                        <div className="space-y-6 mb-12">
                          {((selectedArticle as any).comments || []).map((comment: any, idx: number) => (
                            <div key={idx} className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary font-bold font-serif shrink-0 border border-gray-200">
                                {comment.user.charAt(0)}
                              </div>
                              <div className="bg-surface-cream p-4 rounded-sm border border-outline-variant/30 w-full relative">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-serif text-sm font-bold text-charcoal-text">{comment.user}</span>
                                  <span className="text-[10px] uppercase font-mono text-outline tracking-wider">{comment.date}</span>
                                </div>
                                <p className="font-sans text-sm text-on-surface-variant leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                          
                          {(!(selectedArticle as any).comments || (selectedArticle as any).comments.length === 0) && (
                            <p className="text-sm text-outline italic">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến của bạn!</p>
                          )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-botanical-green/10 flex items-center justify-center text-botanical-green font-bold font-serif shrink-0">
                            U
                          </div>
                          <div className="flex-1">
                            <textarea 
                              id="comment-input"
                              placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                              className="w-full bg-white border border-outline-variant focus:border-antique-gold focus:ring-0 rounded-sm px-4 py-3 text-sm font-sans outline-none min-h-[100px] resize-y mb-3 transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  const text = e.currentTarget.value.trim();
                                  if (text) {
                                    const newComment = {
                                      id: Date.now().toString(),
                                      user: "Người dùng ẩn danh",
                                      avatar: "U",
                                      text: text,
                                      date: new Date().toLocaleDateString('vi-VN')
                                    };
                                    const updatedArticle = { ...selectedArticle, comments: [...((selectedArticle as any).comments || []), newComment] };
                                    setSelectedArticle(updatedArticle as any);
                                    setArticles(articles.map(a => a.id === updatedArticle.id ? (updatedArticle as any) : a));
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            ></textarea>
                            <div className="flex justify-end">
                              <button 
                                onClick={() => {
                                  const input = document.getElementById('comment-input') as HTMLTextAreaElement;
                                  const text = input?.value.trim();
                                  if (text) {
                                    const newComment = {
                                      id: Date.now().toString(),
                                      user: "Người dùng ẩn danh",
                                      avatar: "U",
                                      text: text,
                                      date: new Date().toLocaleDateString('vi-VN')
                                    };
                                    const updatedArticle = { ...selectedArticle, comments: [...((selectedArticle as any).comments || []), newComment] };
                                    setSelectedArticle(updatedArticle as any);
                                    setArticles(articles.map(a => a.id === updatedArticle.id ? (updatedArticle as any) : a));
                                    input.value = '';
                                  }
                                }}
                                className="bg-botanical-green hover:bg-botanical-green/90 text-white px-6 py-2 text-xs uppercase tracking-widest font-bold rounded-sm transition-colors flex items-center gap-2"
                              >
                                <Send className="w-3 h-3" /> Gửi bình luận
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    // 5b. Default List view
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-12"
                    >
                      {/* Active directory labels */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <span className="font-serif text-lg md:text-xl text-secondary font-medium tracking-tight">
                          {selectedCategory}
                        </span>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          Tìm thấy {filteredArticles.length} bài viết
                        </span>
                      </div>

                      {/* Double Column grid cards layout */}
                      {currentItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {currentItems.map((item, idx) => {
                            const isLiked = likedArticles.includes(item.id);
                            // Tag aesthetic colors
                            let tagColor = "bg-secondary text-white";
                            if (item.category === "Dinh dưỡng") tagColor = "bg-antique-gold text-white";
                            else if (item.category === "Phòng bệnh") tagColor = "bg-[#a27e36] text-white";

                            return (
                              <motion.article
                                key={item.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setSelectedArticle(item)}
                                className="card-hover group bg-white border border-gray-100 flex flex-col justify-between overflow-hidden cursor-pointer h-full luxury-shadow"
                              >
                                <div>
                                  {/* Photo area with absolute tags */}
                                  <div className="relative overflow-hidden aspect-[16/10]">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      referrerPolicy="no-referrer"
                                      className="card-img-scale w-full h-full object-cover"
                                    />
                                    {/* Category badge */}
                                    <div className="absolute top-4 left-4">
                                      <span className={`${tagColor} font-mono text-[9px] px-3 py-1 uppercase tracking-wider rounded-[2px]`}>
                                        {item.category}
                                      </span>
                                    </div>

                                    {/* Soft Hover Overlay effect */}
                                    <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </div>

                                  {/* Text area */}
                                  <div className="p-6 space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono uppercase tracking-widest">
                                      <span>{item.date}</span>
                                      <span>|</span>
                                      <span>By {item.author}</span>
                                    </div>

                                    <h3 className="font-serif text-lg md:text-xl text-charcoal-text font-medium leading-snug group-hover:text-secondary hover:underline transition-colors line-clamp-2">
                                      {item.title}
                                    </h3>

                                    <p className="text-gray-500 text-xs md:text-sm leading-relaxed text-justify line-clamp-3">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Read CTA bar */}
                                <div className="p-6 pt-0 flex justify-between items-center mt-auto border-t border-gray-50">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-antique-gold uppercase tracking-wider font-semibold hover:gap-3 transition-all duration-300">
                                    Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                                  </span>

                                  {/* Support interactive icons like heart */}
                                  <button
                                    onClick={(e) => toggleLike(item.id, e)}
                                    className="p-1.5 hover:bg-gray-50 rounded-full transition-colors group/heart focus:outline-none"
                                  >
                                    <Heart className={`w-4 h-4 transition-colors ${
                                      isLiked
                                        ? "fill-red-500 text-red-500 animate-[pulse_0.4s]"
                                        : "text-gray-300 group-hover/heart:text-red-500"
                                    }`} />
                                  </button>
                                </div>
                              </motion.article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-24 bg-white border border-gray-100 rounded-[2px] space-y-4">
                          <BookOpen className="w-12 h-12 text-gray-200 mx-auto" />
                          <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">
                            Không tìm thấy bài viết liên quan
                          </p>
                          <button
                            onClick={() => { setSearchQuery(""); setUpperSearchQuery(""); setSelectedCategory("Tất cả bài viết"); }}
                            className="text-xs font-mono text-secondary hover:underline uppercase tracking-wider font-semibold"
                          >
                            Xóa bộ lọc
                          </button>
                        </div>
                      )}

                      {/* Pagination block controls */}
                      {totalPages > 1 && (
                        <nav className="mt-16 flex justify-center items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-[2px]"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              onClick={() => handlePageChange(num)}
                              className={`w-10 h-10 flex items-center justify-center font-mono text-xs font-medium transition-all rounded-[2px] ${
                                currentPage === num
                                  ? "bg-secondary text-white"
                                  : "border border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary"
                              }`}
                            >
                              {num}
                            </button>
                          ))}

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-[2px]"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </nav>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

            </div>
          </main>
        </>
      )}

      {/* activeTab === "find" (Cách Tìm Giống Lan) */}
      {activeTab === "find" && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 md:px-12 py-24"
        >
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-antique-gold font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                Nghệ Thuật Lựa Chọn Phong Lan
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-secondary">
                Cách Tìm Giống Lan Mỹ Lệ
              </h2>
              <div className="w-16 h-0.5 bg-antique-gold mx-auto" />
              <p className="text-sm text-gray-500 leading-relaxed">
                Để sở hữu những giỏ lan sinh trưởng phồn vinh lâu dài, chất lượng phôi giống ban đầu quyết định tới 80% sự thành bại. 
                Hãy tham khảo cẩm nang nhận diện 4 đại diện danh giá nhất làng Lan.
              </p>
            </div>

            {/* Orchid catalog showcase cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1 */}
              <div className="bg-white border border-gray-100 overflow-hidden flex flex-col md:flex-row luxury-shadow">
                <div className="w-full md:w-2/5 h-48 md:h-auto bg-gray-50">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p"
                    alt="Lan Hồ Điệp"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-3/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded font-mono font-bold">1. LAN HỒ ĐIỆP</span>
                    <span className="text-xs text-gray-400 font-serif italic">Phalaenopsis</span>
                  </div>
                  <h3 className="font-serif text-lg text-charcoal-text font-bold">Nữ hoàng kiêu sa, bền lâu nhất</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    **Mẹo chọn**: Chọn bầu rễ xum xuê chắc nịch, màu xanh lá căng mọng, không đốm mốc đen. Lá xanh sẫm, bản dẹp dẹt, dày mịn dẻo dai.
                  </p>
                  <div className="flex gap-4 pt-1">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> Khô mới tưới</span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3 text-yellow-500" /> Tán xạ 40-50%</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-gray-100 overflow-hidden flex flex-col md:flex-row luxury-shadow">
                <div className="w-full md:w-2/5 h-48 md:h-auto bg-gray-50">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLtJTsse4QCP9lf4bVR5zJMChIWf2pzEyXOJlRQf2ocGVjs7ufKeIoK6e_pXQxHRhIJE7TO-K3QNOSUVoyTg0QnqZiTrtX8zdEtNxkmnsJ7ACUfaSM5nX994-acMmZU8YDbdV7VSBvdMZFeeJLaJghiqnql6qQiISw9IdIsEqlU-v31gg639QM3pjLJX2kaNvxQoSwag5XaRu19me0BWtth20WkjbtYqQd614Pp4C4lsd_6RJ7a2_rlIHTNm"
                    alt="Lan Vũ Nữ"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-3/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-antique-gold/10 text-antique-gold text-[10px] px-2 py-0.5 rounded font-mono font-bold">2. LAN VŨ NỮ</span>
                    <span className="text-xs text-gray-400 font-serif italic">Oncidium</span>
                  </div>
                  <h3 className="font-serif text-lg text-charcoal-text font-bold">Văn nhân nhảy múa rực rỡ</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    **Mẹo chọn**: Giả hành căng bành bóng mịn, không bị nhăn rọm sâu sắc. Bộ rễ tơ trắng muốt có đầu tơ xanh tốt mơn mởn.
                  </p>
                  <div className="flex gap-4 pt-1">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> Giữ ẩm nhẹ</span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3 text-yellow-500" /> Nắng nhẹ 60%</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-100 overflow-hidden flex flex-col md:flex-row luxury-shadow">
                <div className="w-full md:w-2/5 h-48 md:h-auto bg-gray-50">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLtTtnS65VcjE7BE31n6y5CeK_0J2DRVQcvXU4HlNMBxcfpDOW3aT76mDA56cmtNwXL_WmMQkT87iaHAkRCMT1K2d36dvOES_KWEWzfiBRIO90Pnmcu84A72t6BmJzd5lEwRazPS9IRjhMLExRWVo9vVZ7Ep1CcivILrBmqP6CG76r0kI1MRGGHSq6FzzhFvO9h5CTxf-PRMLiqwHFJCEuqfCElwpHgdu5PJPFCgnSHkHc0GFuOYThzmTPwP"
                    alt="Lan Cattleya"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-3/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-900/10 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">3. LAN CATTLEYA</span>
                    <span className="text-xs text-gray-400 font-serif italic">Cattleya</span>
                  </div>
                  <h3 className="font-serif text-lg text-charcoal-text font-bold">Đại hoàng đế hương thơm ngào ngạt</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    **Mẹo chọn**: Chọn bụi có tối thiểu 3-4 giả hành, có mắt ngủ ở gốc khoẻ mạnh chưa bung ki non bừa bãi. Thân cứng chắc thẳng dòng.
                  </p>
                  <div className="flex gap-4 pt-1">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> Khô kiệt nhẹ</span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3 text-yellow-500" /> Tán xạ thoáng</span>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-gray-100 overflow-hidden flex flex-col md:flex-row luxury-shadow">
                <div className="w-full md:w-2/5 h-48 md:h-auto bg-gray-50">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLs9UWwOOKykmjUK0vo6PHvn64CTFonRCmy-IwTey68h0e_xMVWSxLosK2dFy4uW_pSm6oiW_6nKtWoltBH_dE9EkR03QR635E2DPE6wYDMETStRUvLmsu-qtMnXbbolMpFtK5GjzOPs693t8pxtZFLAe31Sb7zvmsVKo32zauEDwv656NQ0G9n3K0_xuVy37y0DrWhit7SG74WSfsRGkvwNCiQLGVWBP7lHD-Mb2itSgkJeWUyo0SYvsfJc"
                    alt="Lan Dendrobium"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-3/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-950/10 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">4. DENDROBIUM</span>
                    <span className="text-xs text-gray-400 font-serif italic">Hoàng Thảo</span>
                  </div>
                  <h3 className="font-serif text-lg text-charcoal-text font-bold">Bỉ dẻo dai siêng hoa nhất xứ</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    **Mẹo chọn**: Thân giò mập dẹt thẳng đứng kiên cường, lá dày bóng xếp xít xịt nhau từ gốc đến sát ngọn. Không bị thối nách lá tơ.
                  </p>
                  <div className="flex gap-4 pt-1">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> Nước đều đều</span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3 text-yellow-500" /> Nắng tốt 70%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.main>
      )}

      {/* activeTab === "docs" (Tài Liệu Bảo Tồn Phong Lan) */}
      {activeTab === "docs" && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 md:px-12 py-24"
        >
          <div className="space-y-12 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <span className="text-secondary font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                Thư Viện Tri Thức Thực Vật
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-secondary">
                Tài Liệu Bảo Tồn &amp; Nghiên Cứu
              </h2>
              <p className="text-sm text-gray-400">
                Lưu trữ các báo cáo nghiên cứu phục hồi đa dạng sinh học hệ thực vật lan rừng hoang dã Việt Nam.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: "Khảo sát đa dạng phong lan tự nhiên tại Vườn Quốc Gia Cúc Phương",
                  size: "4.8 MB",
                  type: "Báo cáo khoa học",
                  desc: "Phân tích 118 loài phong lan hoang dã quý hiếm cần phục dựng di truyền nhân giống chống săn trộm hoang dã."
                },
                {
                  title: "Phổ quang học tối ưu nuôi cấy mô lan Hồ Điệp công nghiệp sạch bệnh",
                  size: "2.1 MB",
                  type: "Tài liệu kỹ thuật",
                  desc: "Hướng dẫn cài đặt bước sóng LED ánh sáng xanh/đỏ cho tỉ lệ nứt phôi đỉnh sinh trưởng nhanh gấp đôi."
                },
                {
                  title: "Danh mục đỏ (IUCN Red List) phân bộ Lan hài Đốm đen vùng Tây Bắc",
                  size: "1.5 MB",
                  type: "Ấn bản đặc biệt",
                  desc: "Chương trình phối hợp hành động bảo tồn đặc chủng địa lan Paphiopedilum quý giá tột cùng."
                }
              ].map((doc, idx) => (
                <div key={idx} className="bg-white p-6 border border-gray-100 luxury-shadow flex items-start gap-4 hover:border-antique-gold transition-colors">
                  <div className="p-3 bg-secondary/5 text-secondary shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-antique-gold font-bold uppercase tracking-wider">{doc.type}</span>
                      <span className="text-[10px] font-mono text-gray-400">{doc.size}</span>
                    </div>
                    <h3 className="font-serif text-base text-charcoal-text font-bold">{doc.title}</h3>
                    <p className="text-xs text-gray-500">{doc.desc}</p>
                    <button
                      onClick={() => alert("Hệ thống liên kết thư viện lưu hành nội bộ đang phân chuyển... Bản sao điện tử sẽ gửi về hòm tài liệu của bạn.")}
                      className="text-xs text-secondary hover:text-antique-gold font-mono uppercase tracking-wider font-semibold block pt-2 cursor-pointer"
                    >
                      Tải Tài Liệu ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.main>
      )}

      {/* 6. Elegant Footer Bar */}
      <footer className="bg-white border-t border-gray-100 py-16 md:py-24 mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          {/* Main Footer columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-gray-100">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <h4 className="font-serif text-2xl text-secondary font-medium tracking-wide">Orchids</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Dedicated to the timeless art of premium orchid conservation, classic botanical excellence, and refined organic luxury living spaces.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-300">
                <Globe2 className="w-3.5 h-3.5" /> L'art floral botanique
              </span>
            </div>

            {/* Column 2: Explore */}
            <div className="space-y-4">
              <h5 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-widest">Khám phá</h5>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Tất cả giống lan</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Vườn bảo mẫu mẫu bảo ôn</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Nhiếp ảnh hoa trưng bày</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Liên kết đại lý cổ thụ</a>
              </div>
            </div>

            {/* Column 3: Policy */}
            <div className="space-y-4">
              <h5 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-widest">Hỗ trợ & Bảo tồn</h5>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Thành viên quý tộc</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Quy trình đóng gói vận chuyển</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Hiệp hội phong lan Việt Nam</a>
                <a href="#" className="text-xs text-gray-500 hover:text-secondary transition-colors">Gửi hỗ trợ nghiên cứu sinh học</a>
              </div>
            </div>

            {/* Column 4: Language Selector */}
            <div className="space-y-4">
              <h5 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-widest">Ngôn ngữ chính</h5>
              <div className="space-y-2">
                <p className="text-xs text-secondary font-semibold flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-antique-gold" /> TIẾNG VIỆT (CHÍNH)
                </p>
                <div className="flex flex-col gap-1 pl-3 text-xs text-gray-400">
                  <span>English (Global)</span>
                  <span>Français (Classique)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright credits */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">
              © 2026 ORCHIDÉE LUXE CO. DEDICATED TO BOTANICAL PRESERVATION.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-soft-olive" />
              <span className="text-[9px] font-mono text-gray-300 uppercase tracking-widest">Nguồn cảm hứng thiên nhiên vĩnh cửu</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 7. Floating Ask-an-Expert AI Consultation chatbot panel component */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="absolute bottom-20 right-0 w-80 md:w-96 bg-white border border-gray-150 rounded-xl shadow-2xl flex flex-col overflow-hidden text-sm"
              style={{ maxHeight: "550px" }}
            >
              {/* Box Header Custom styling */}
              <div className="bg-secondary text-white p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                {/* Decorative gold background circles */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-antique-gold/15 rounded-full translate-x-8 -translate-y-8" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 select-none animate-[pulse_2s_infinite]">
                    <span className="text-lg">🌸</span>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm tracking-wide">Cố Vấn Orchidée Luxe</h4>
                    <span className="text-[10px] font-mono text-soft-olive tracking-widest flex items-center gap-1 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-soft-olive animate-ping" /> AI expert online
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white focus:outline-none relative z-10"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Box Chat Message logs */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-cream text-xs min-h-[250px] max-h-[350px]">
                {chatMessages.map((msg) => {
                  const isBot = msg.sender === "bot";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isBot ? "justify-start" : "justify-end"} items-start gap-2.5`}
                    >
                      {isBot && (
                        <div className="w-6 h-6 rounded-full bg-secondary/10 border border-secondary/15 flex items-center justify-center shrink-0 select-none text-[11px] mt-0.5">
                          🏺
                        </div>
                      )}
                      <div className="space-y-1 max-w-[75%]">
                        <div className={`p-3 rounded-lg leading-relaxed ${
                          isBot
                            ? "bg-white text-gray-700 border border-gray-100 rounded-tl-none whitespace-pre-line text-justify shadow-sm"
                            : "bg-secondary text-white rounded-tr-none text-right shadow-sm"
                        }`}>
                          {msg.text}
                        </div>
                        <p className={`text-[9px] font-mono text-gray-400 ${!isBot ? "text-right" : ""}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing loader state */}
                {isChatLoading && (
                  <div className="flex justify-start items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 animate-spin text-[11px] mt-0.5">
                      🌸
                    </div>
                    <div className="bg-white border border-gray-100 text-gray-400 p-3 rounded-lg rounded-tl-none italic font-serif shadow-sm">
                      Nghệ nhân đang suy ngẫm giải pháp sinh trưởng...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Bot Instant FAQs starter queries buttons */}
              <div className="p-2.5 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  "Lan Hồ Điệp của tôi bị vàng rụng rễ?",
                  "Tưới nước mùa hanh khô ra sao?",
                  "Bí quyết dưỡng Vũ Nữ giả hành căng bóng?",
                  "Làm sao kích bông Dendrobium nở rộ?"
                ].map((faq) => (
                  <button
                    key={faq}
                    disabled={isChatLoading}
                    onClick={() => handleSendMessage(undefined, faq)}
                    className="text-[10px] font-sans font-medium text-secondary hover:text-white hover:bg-secondary border border-secondary/15 px-3 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    {faq}
                  </button>
                ))}
              </div>

              {/* Message inputs form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Hỏi chuyên gia về phong lan quý..."
                  value={chatMessageInput}
                  disabled={isChatLoading}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  className="flex-grow border border-gray-200 text-xs px-3.5 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors focus:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatMessageInput.trim()}
                  className="bg-secondary hover:bg-secondary-hover text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 disabled:opacity-40 disabled:pointer-events-none focus:outline-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 8. User Login popup modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-lg overflow-hidden border border-gray-100 luxury-shadow-deep p-6 relative"
            >
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-charcoal-text focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6 pt-4 text-center">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-antique-gold uppercase tracking-[0.2em] font-semibold">
                    Đăng Ký Hội Viên Bản Địa
                  </span>
                  <h3 className="font-serif text-2xl text-secondary">
                    Gia Nhập Orchidée Luxe
                  </h3>
                  <p className="text-xs text-gray-400">
                    Lưu trữ các cuốn cẩm nang riêng và tham vấn cùng chuyên gia độc quyền.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Tên Nghệ nhân</label>
                    <input
                      required
                      type="text"
                      placeholder="Nguyễn Văn Lan"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Hòm thư điện tử (Email)</label>
                    <input
                      required
                      type="email"
                      placeholder="nguyen.van@orchideeluxe.vn"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-center text-xs font-mono py-3 font-semibold bg-secondary hover:bg-secondary-hover text-white uppercase tracking-widest rounded-[2px] shadow-md transition-colors"
                  >
                    Xác nhận gia nhập
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Share Article popup Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-lg border border-gray-150 luxury-shadow-deep p-6 relative my-8"
            >
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-charcoal-text focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="text-center space-y-1.5 pb-2 border-b border-gray-100">
                  <span className="text-[10px] font-mono text-antique-gold uppercase tracking-[0.25em] font-semibold">
                    Độc Giả Đồng Hành Bảo Tồn
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl text-secondary">
                    Chia Sẻ Cẩm Nang Của Bạn
                  </h3>
                  <p className="text-xs text-gray-400">
                    Chia sẻ bài học chăm lan thực tế của chính bạn để vinh danh cộng đồng đam mê cổ thụ lan.
                  </p>
                </div>

                <form onSubmit={handleShareArticle} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Tên bài viết</label>
                      <input
                        required
                        type="text"
                        placeholder="Ví dụ: Cách cứu hoa hồ điệp úng rễ"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Tác giả</label>
                      <input
                        required
                        type="text"
                        placeholder="Nghệ nhân Hoàng Nam"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Danh mục chính</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as Article["category"])}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                      >
                        <option value="Kỹ thuật">Kỹ thuật tưới nước</option>
                        <option value="Dinh dưỡng">Bón phân & Dinh dưỡng</option>
                        <option value="Phòng bệnh">Phòng trừ sâu bệnh</option>
                        <option value="Mẹo vặt">Kích hoa nở</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Hình ảnh minh họa</label>
                      <select
                        value={newImgUrl}
                        onChange={(e) => setNewImgUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                      >
                        <option value="https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p">
                          Lan Hồ Điệp
                        </option>
                        <option value="https://lh3.googleusercontent.com/aida/AP1WRLtJTsse4QCP9lf4bVR5zJMChIWf2pzEyXOJlRQf2ocGVjs7ufKeIoK6e_pXQxHRhIJE7TO-K3QNOSUVoyTg0QnqZiTrtX8zdEtNxkmnsJ7ACUfaSM5nX994-acMmZU8YDbdV7VSBvdMZFeeJLaJghiqnql6qQiISw9IdIsEqlU-v31gg639QM3pjLJX2kaNvxQoSwag5XaRu19me0BWtth20WkjbtYqQd614Pp4C4lsd_6RJ7a2_rlIHTNm">
                          Lan Vũ Nữ
                        </option>
                        <option value="https://lh3.googleusercontent.com/aida/AP1WRLtTtnS65VcjE7BE31n6y5CeK_0J2DRVQcvXU4HlNMBxcfpDOW3aT76mDA56cmtNwXL_WmMQkT87iaHAkRCMT1K2d36dvOES_KWEWzfiBRIO90Pnmcu84A72t6BmJzd5lEwRazPS9IRjhMLExRWVo9vVZ7Ep1CcivILrBmqP6CG76r0kI1MRGGHSq6FzzhFvO9h5CTxf-PRMLiqwHFJCEuqfCElwpHgdu5PJPFCgnSHkHc0GFuOYThzmTPwP">
                          Lan Cattleya
                        </option>
                        <option value="https://lh3.googleusercontent.com/aida/AP1WRLs9UWwOOKykmjUK0vo6PHvn64CTFonRCmy-IwTey68h0e_xMVWSxLosK2dFy4uW_pSm6oiW_6nKtWoltBH_dE9EkR03QR635E2DPE6wYDMETStRUvLmsu-qtMnXbbolMpFtK5GjzOPs693t8pxtZFLAe31Sb7zvmsVKo32zauEDwv656NQ0G9n3K0_xuVy37y0DrWhit7SG74WSfsRGkvwNCiQLGVWBP7lHD-Mb2itSgkJeWUyo0SYvsfJc">
                          Lan Dendrobium
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Tóm tắt ngắn</label>
                    <input
                      required
                      type="text"
                      placeholder="Tóm tắt ngắn gọn trong 1-2 câu về kinh nghiệm này..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Nội dung chi tiết (Cẩm nang cụ thể)</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Ghi rõ chi tiết phương pháp làm, nguyên liệu chuẩn bị, tần suất bón bổ trợ và các phản ứng tích cực..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-[2px] bg-surface-cream focus:outline-none focus:ring-1 focus:ring-antique-gold transition-colors font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-center text-xs font-mono py-3 font-semibold bg-secondary hover:bg-secondary-hover text-white uppercase tracking-widest rounded-[2px] shadow-sm transition-colors"
                  >
                    Đăng tải bài chia sẻ
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
