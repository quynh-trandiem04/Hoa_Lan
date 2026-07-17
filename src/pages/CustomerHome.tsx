import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Share2, 
  ArrowDown, 
  BookOpen, 
  GraduationCap, 
  Library, 
  X, 
  Sparkles, 
  Sprout, 
  Check, 
  HelpCircle,
  MessageSquare,
  Bookmark
} from "lucide-react";
import { orchidData, pillarDetails, INITIAL_ORCHIDS, INITIAL_CATEGORIES } from "../data";
import { OrchidItem, PillarDetail } from "../types";

// Import custom interactive components
import OrchidDetailModal from "../components/OrchidDetailModal";
import PillarDetailModal from "../components/PillarDetailModal";
import ResearchViewer from "../components/ResearchViewer";

import BotAdvisor from "../components/BotAdvisor";

import SearchModal from "../components/SearchModal";

export default function CustomerHome({ onNavigate }: { onNavigate: (screen: string, id?: string) => void }) {
  // Modal states
  const [selectedOrchid, setSelectedOrchid] = useState<OrchidItem | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarDetail | null>(null);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  
  // Custom interactive panels (header overlays)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Category Slider State
  const [sliderIndex, setSliderIndex] = useState(0);
  const totalCards = orchidData.length;
  // We can show indices. On desktop, show 3 items. On mobile, show 1.
  const cardsRef = useRef<HTMLDivElement>(null);



  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const handleNextSlide = () => {
    setSliderIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrevSlide = () => {
    setSliderIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast("✨ Sao chép liên kết thành công! Hãy chia sẻ cùng những người yêu Hoa lan.");
  };

  return (
    <div className="bg-surface-cream text-[#1a1c1b] min-h-screen font-sans selection:bg-soft-olive selection:text-[#56642b] scroll-smooth">
      
      {/* 1. Header Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 h-16 bg-surface-cream/85 backdrop-blur-md border-b border-[#56642b]/5 transition-all">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto h-full">
          {/* Logo */}
          <div className="font-serif italic text-xl md:text-2xl text-botanical-green font-bold tracking-tight select-none">
            Orchids
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="font-sans text-xs uppercase tracking-wider font-semibold text-botanical-green border-b-2 border-botanical-green pb-1 transition-all">
              Trang Chủ
            </a>
            
            {/* Direct Category Access Dropdown */}
            <div className="relative group">
              <button onClick={() => onNavigate('list_orchids')} className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors flex items-center gap-1 cursor-pointer">
                DANH MỤC LAN
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-surface-cream border border-[#747878]/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-3 mt-2 rounded">
                <ul className="flex flex-col">
                  {INITIAL_CATEGORIES.map((cat: any) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => onNavigate('list_orchids', cat.id)}
                        className="w-full text-left px-5 py-2.5 font-serif text-sm text-on-surface-variant hover:bg-botanical-green/5 hover:text-botanical-green transition-colors cursor-pointer"
                      >
                        {cat.name} ({cat.scientificName.split(" ")[0]})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <a href="/planting-and-care" className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors">
              Cách trồng và chăm sóc
            </a>
            
            <a href="/document" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Tài liệu
            </a>
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
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 hover:bg-botanical-green/5 text-botanical-green rounded-full transition-colors cursor-pointer"
              title="Tìm kiếm loài lan"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="p-1.5 hover:bg-botanical-green/5 text-botanical-green rounded-full transition-colors cursor-pointer"
              title="Trang quản lý hồ sơ"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 1b. Search Overlay Panels */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={onNavigate} 
      />

      {/* 1c. Profile Overlay Panel */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-antique-gold/15 overflow-hidden"
            >
              <div className="p-5 border-b border-surface-container flex justify-between items-center bg-surface-cream/50">
                <h4 className="font-serif text-charcoal-text font-semibold">Thẻ Hội Viên Viện Phong Lan</h4>
                <button onClick={() => setIsProfileOpen(false)} className="p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 text-center space-y-4">
                <div className="w-20 h-20 bg-botanical-green/10 rounded-full mx-auto flex items-center justify-center text-botanical-green border border-botanical-green/20">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h5 className="font-serif text-lg text-charcoal-text font-bold">Khách Hàng Thưởng Lãm</h5>
                  <p className="text-xs text-on-surface-variant font-mono uppercase mt-1">ID HỘI VIÊN: #OL-2026-8899</p>
                </div>
                <div className="p-4 bg-surface-cream/70 rounded-lg text-left text-xs font-sans space-y-2 border border-surface-container">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Phân hạng:</span>
                    <span className="font-semibold text-antique-gold">Hội viên Khởi sự (Pro)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Cá thể lưu trữ:</span>
                    <span className="font-semibold text-charcoal-text">4 dòng phong lan cơ bản</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Khu vực vườn kính:</span>
                    <span className="font-semibold text-charcoal-text">Nội thành Hà Nội / TP.HCM</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsProfileOpen(false); triggerToast("🎁 Hệ thống đang đồng bộ dữ liệu nông nghiệp cao."); }}
                    className="flex-1 py-2 bg-botanical-green hover:bg-botanical-green/90 text-white rounded font-sans text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cập nhật vườn của tôi
                  </button>
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 border border-[#747878]/30 rounded font-sans text-xs text-charcoal-text hover:bg-surface-cream cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/25 z-10"></div>
          <img 
            className="w-full h-full object-cover transition-transform duration-[10000ms] scale-102 hover:scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEjxfg07deoOmsn5iwPWO7HBi7H4Xzs5MAcRkgBSdki56Mc3jnLy5--YHOiJ_xTR6bvfvc12Zh5ok5FnjYdI3gcMXUDPgU5yLFpyk62wwuLQgncSXhIDDzajocQp7I3R8DrIFKUMrurKeyFkFY8mRpDHU4B7338F7CYkV5MX_Cu2FGn0Z3Gitu5Qd1_I4YclJXFDR_Z8RBMio8C7LvmplAmvsYo2ZD_U8Rygd2qT3mJgateTXAOzLGFf1tnJkWiDR8RhpKRVsBFcWX"
            alt="Ethereal botanical garden orchids background"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-20 text-center px-6 max-w-4xl text-white mt-8">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs md:text-sm uppercase tracking-[0.3em] font-medium block mb-4 text-[#d6e7a1] font-sans"
          >
            L'ART DE VIVRE BOTANICAL RESEARCH
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-4xl md:text-6xl text-white mb-6 leading-[1.12] drop-shadow-md max-w-3xl mx-auto"
          >
            Hoa Lan – Kiệt Tác Của Thiên Nhiên Và Dấu Ấn Thời Gian
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-sans text-sm md:text-base text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Khám phá thế giới đa dạng của loài hoa vương giả, nơi sự tinh khiết của tự nhiên gặp gỡ nghệ thuật sống tinh tế. Chúng tôi tận tâm bảo tồn và chia sẻ tinh hoa tri thức về hoa lan.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#about"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white text-white font-sans text-xs uppercase tracking-widest hover:bg-white hover:text-botanical-green transition-all duration-300 font-bold"
            >
              Khám Phá Thế Giới Hoa Lan
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 3. About Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto bg-surface-cream" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Sub content and Pillars */}
          <div className="space-y-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#735c00] font-bold">KỶ NGUYÊN BẢO TỒN HOÀNG GIA</span>
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal-text leading-tight font-medium">
              Sứ mệnh bảo tồn và chia sẻ tri thức
            </h2>
            <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
              Orchids không chỉ là một nền tảng, mà là một không gian số chuyên biệt dành cho những người yêu Lan. Chúng tôi hướng tới việc lưu trữ khoa học, quản lý bảo tồn và lan tỏa tri thức một cách toàn diện về thế giới hoa lan đầy mê hoặc.
            </p>

            <div className="space-y-8 pt-4">
              {/* Pillar 1 */}
              <div 
                onClick={() => setSelectedPillar(pillarDetails.encyclopedia)}
                className="flex gap-5 group cursor-pointer p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-[#56642b]/10"
              >
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-container text-[#56642b] group-hover:bg-[#56642b] group-hover:text-white transition-all duration-300 rounded">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-charcoal-text font-bold group-hover:text-[#56642b] transition-colors flex items-center gap-1.5">
                    BÁCH KHOA TOÀN THƯ
                    <span className="text-[10px] font-mono text-antique-gold font-normal">Xem</span>
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-1">
                    Tra cứu thông tin, đặc điểm sinh học và nguồn gốc chi tiết của hàng ngàn chủng loại Lan trên thế giới.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div 
                onClick={() => window.location.href = '/discussion'}
                className="flex gap-5 group cursor-pointer p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-[#56642b]/10"
              >
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-container text-[#56642b] group-hover:bg-[#56642b] group-hover:text-white transition-all duration-300 rounded">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-charcoal-text font-bold group-hover:text-[#56642b] transition-colors flex items-center gap-1.5">
                    THẢO LUẬN
                    <span className="text-[10px] font-mono text-antique-gold font-normal">Xem</span>
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-1 flex-1">
                    Nơi giao lưu, trao đổi kinh nghiệm và giải đáp thắc mắc về các loài phong lan.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div 
                onClick={() => setSelectedPillar(pillarDetails.library)}
                className="flex gap-5 group cursor-pointer p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-[#56642b]/10"
              >
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-container text-[#56642b] group-hover:bg-[#56642b] group-hover:text-white transition-all duration-300 rounded">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-charcoal-text font-bold group-hover:text-[#56642b] transition-colors flex items-center gap-1.5">
                    THƯ VIỆN TÀI LIỆU
                    <span className="text-[10px] font-mono text-antique-gold font-normal">Xem</span>
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-1">
                    Kho lưu trữ các văn bản, nghiên cứu chuyên sâu và những bài báo khoa học về công tác bảo tồn giống Lan quý.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Botanist Scholar Image */}
          <div className="relative">
            <div className="aspect-[4/5] bg-surface-container overflow-hidden rounded-lg shadow-xl relative group">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" 
                src="/research-botanist.png"
                alt="Professional botanist investigating Phalaenopsis orchid in laboratory greenhouse"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center">
                <button 
                  onClick={() => setIsResearchOpen(true)}
                  className="px-6 py-3 bg-white text-botanical-green hover:bg-botanical-green hover:text-white transition-all text-xs font-sans font-bold uppercase tracking-widest cursor-pointer rounded"
                >
                  Mở Thư Viện Nghiên Cứu
                </button>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-botanical-green/5 -z-10 blur-xl"></div>
          </div>

        </div>
      </section>

      {/* 4. Category Slider Section */}
      <section className="bg-surface-container-low py-24 border-y border-[#56642b]/5">
        <div className="max-w-7xl mx-auto px-6 md:px-16 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal-text font-medium">Các dòng Lan tiêu biểu</h2>
            <p className="font-sans text-xs text-on-surface-variant italic mt-2">
              Tiêu chí phân loại: Hệ thống phân loại khoa học Orchids
            </p>
          </div>
          
          {/* Arrow navigation handles slider offset */}
          <div className="flex gap-3">
            <button 
              onClick={handlePrevSlide}
              aria-label="Previous card"
              className="w-12 h-12 border border-outline-variant/50 flex items-center justify-center hover:border-botanical-green hover:text-botanical-green transition-all rounded bg-white cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextSlide}
              aria-label="Next card"
              className="w-12 h-12 border border-outline-variant/50 flex items-center justify-center hover:border-botanical-green hover:text-botanical-green transition-all rounded bg-white cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories cards viewport */}
        <div className="px-6 md:px-16 max-w-7xl mx-auto overflow-hidden">
          <motion.div 
            ref={cardsRef}
            className="flex gap-8 transition-all duration-500 ease-out py-2"
            animate={{ x: `-${(sliderIndex * 100) / totalCards}%` }}
            style={{ width: `${totalCards * 100}%`, maxWidth: "none" }}
          >
            {orchidData.map((item: any, index: number) => (
              <div 
                key={item.id} 
                className="w-full sm:w-[380px] shrink-0 group flex flex-col justify-between"
                style={{ width: "380px" }}
              >
                <div>
                  <div className="aspect-square bg-white overflow-hidden luxury-shadow mb-5 rounded border border-surface-container relative">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      src={item.image} 
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Tiny species code tag */}
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/65 text-white font-mono text-[9px] uppercase tracking-wider rounded">
                      ID: {item.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-charcoal-text mb-1">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-mono uppercase text-[#735c00] tracking-wider mb-2.5">
                    {item.scientificName}
                  </p>
                  <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={() => onNavigate('orchid_detail', item.id)}
                    className="font-sans text-xs font-bold uppercase text-botanical-green border-b border-botanical-green/20 hover:border-botanical-green transition-colors pb-1 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* 6. Footer section */}
      <footer className="bg-surface-cream w-full py-16 border-t border-botanical-green/10">
        <div className="grid grid-cols-1 md:grid-cols-12 px-6 md:px-16 max-w-7xl mx-auto gap-12">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="font-serif italic text-2xl text-botanical-green font-bold">Orchids</div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed max-w-sm">
              Nền tảng nghiên cứu và quản lý hoa lan chuyên nghiệp, cam kết vì sự bền vững và vẻ đẹp của thiên nhiên thông qua các phương pháp bảo tồn khoa học.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="md:col-span-4 md:col-start-6">
            <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-botanical-green mb-5">Nghiên cứu</h4>
            <ul className="space-y-3 font-sans text-xs">
              <li>
                <button onClick={() => setSelectedPillar(pillarDetails.encyclopedia)} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left">
                  Cơ sở dữ liệu chi loài
                </button>
              </li>
              <li>
                <button onClick={() => setIsResearchOpen(true)} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left">
                  Tài liệu bảo tồn lâm nghiệp
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedPillar(pillarDetails.manual)} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left">
                  Hệ sinh thái Orchidaceae
                </button>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="md:col-span-3">
            <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-botanical-green mb-5">Thông tin</h4>
            <ul className="space-y-3 font-sans text-xs">
              <li>
                <button onClick={() => triggerToast("✨ Orchids được sáng lập bởi nhóm nghiên cứu thực vật năm 2024.")} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left">
                  Về chúng tôi
                </button>
              </li>
              <li>
                <button onClick={() => triggerToast("📧 Email hỗ trợ khoa học: research@orchidee-luxe.vn")} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left font-sans">
                  Liên hệ cố vấn
                </button>
              </li>
              <li>
                <button onClick={() => triggerToast("🔒 Dữ liệu nghiên cứu của hội viên được mã hóa an toàn.")} className="text-on-surface-variant hover:text-botanical-green transition-colors cursor-pointer text-left">
                  Chính sách bảo mật
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Fine prints */}
        <div className="px-6 md:px-16 max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-on-surface-variant/80">
            © 2026 Orchids. L'art de vivre botanical research.
          </p>
          <div className="flex gap-6 text-[#747878]">
            <button 
              onClick={() => triggerToast("🌐 Phiên bản quốc tế đang được chuyển hóa ngôn ngữ.")} 
              className="hover:text-botanical-green transition-colors cursor-pointer"
              title="Chuyển đổi ngôn ngữ"
            >
              <Globe className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={handleShare} 
              className="hover:text-botanical-green transition-colors cursor-pointer"
              title="Chia sẻ chia sẻ"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Action Help Chat Button */}

      {/* Floating toast notification bar */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-charcoal-text text-white text-xs font-sans px-5 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md text-center"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Modal rendering drawers */}
      <AnimatePresence>
        {selectedOrchid && (
          <OrchidDetailModal 
            orchid={selectedOrchid} 
            onClose={() => setSelectedOrchid(null)} 
          />
        )}

        {selectedPillar && (
          <PillarDetailModal 
            pillar={selectedPillar} 
            onClose={() => setSelectedPillar(null)} 
          />
        )}

        {isResearchOpen && (
          <ResearchViewer 
            onClose={() => setIsResearchOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Interactive Bot Drawer Component */}
      <BotAdvisor 
        isOpen={isBotOpen} 
        onClose={() => setIsBotOpen(false)} 
      />

    </div>
  );
}
