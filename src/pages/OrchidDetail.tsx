import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Download, MapPin, Calendar, Sun, Thermometer, UserCheck, Search, User, ChevronRight, ThumbsUp } from 'lucide-react';
import { INITIAL_ORCHIDS, INITIAL_CATEGORIES, orchidData } from '../data';
import { Orchid } from '../types';
import SearchModal from '../components/SearchModal';
import { getOrchidImageUrls } from '../utils/orchidImages';

interface OrchidDetailProps {
  id: string;
  onNavigate: (screen: string, id?: string) => void;
}

export default function OrchidDetail({ id, onNavigate }: OrchidDetailProps) {
  const [orchid, setOrchid] = useState<Orchid | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // comments state
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1, author: "Minh Hoàng", time: "2 ngày trước", content: "Kinh nghiệm của mình là nên dùng nước mưa để tưới, lan phát triển rất nhanh và lá xanh mướt hơn hẳn nước máy.", likes: 12, replies: [
        { id: 2, author: "Quốc Bảo", time: "1 ngày trước", content: "Đúng vậy anh Hoàng, nước mưa có độ pH rất lý tưởng cho Lan Hồ Điệp. Anh thường tưới vào khung giờ nào trong ngày ạ?" }
      ]
    }
  ]);

  // Fetch orchid data
  useEffect(() => {
    let found = INITIAL_ORCHIDS.find(o => o.id === id);
    const foundItem = orchidData.find(o => o.id === id) || orchidData[0]; // fallback to first if not found

    setActiveImageIdx(0);

    if (found) {
      setOrchid({
        ...found,
        // merge with mock data for display
        highlightDescription: foundItem.longDescription,
        lightDetail: foundItem.light,
        tempDetail: foundItem.temperature,
        watering: foundItem.watering,
        fertilizer: foundItem.fertilizer,
        soilType: foundItem.soilType,
      });
    } else {
      if (foundItem) {
        setOrchid({
          id: foundItem.id,
          name: foundItem.name,
          englishName: foundItem.scientificName,
          categoryIds: [],
          shortDescription: foundItem.description,
          detailedDescription: foundItem.longDescription,
          hasFragrance: true,
          isPopular: true,
          slug: foundItem.id,
          uploadedImageIds: [foundItem.image],
          displayOrder: 0,
          highlightDescription: foundItem.longDescription,
          lightDetail: foundItem.light,
          tempDetail: foundItem.temperature,
          watering: foundItem.watering,
          fertilizer: foundItem.fertilizer,
          soilType: foundItem.soilType,
        });
      }
    }

    // check bookmark
    const saved = localStorage.getItem('orchidee-luxe-bookmarks-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsBookmarked(parsed.includes(id));
      } catch (e) {}
    }
  }, [id]);

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
      } catch (e) {}
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
  };

  const handleDownload = () => {
    if (!orchid) return;
    const careText = `
========================================
ORCHIDS LUXE - CẨM NANG CHĂM SÓC HOA LAN
========================================
Tên hoa lan: ${orchid.name}
Tên khoa học: ${orchid.englishName}
----------------------------------------
Mô tả:
${orchid.detailedDescription}
========================================
`;
    const blob = new Blob([careText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orchids-luxe-${orchid.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đang tải xuống tài liệu chăm sóc...');
  };

  if (!orchid) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] pt-24 flex justify-center items-center">
        <p className="text-[#747878] font-sans">Đang tải thông tin hoa lan...</p>
      </div>
    );
  }

  const categoryName = INITIAL_CATEGORIES.find(c => c.id === orchid.categoryIds?.[0])?.name || 'Chưa phân loại';

  // Format images
  const images = getOrchidImageUrls(orchid);
  const placeholders = [
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508759073836-39ce8eb75249?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599859664560-eb5b0ee80a8f?auto=format&fit=crop&w=800&q=80'
  ];
  while (images.length < 4) {
    images.push(placeholders[images.length % placeholders.length]);
  }

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
              <button onClick={() => onNavigate('list_orchids')} className="font-sans text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-botanical-green transition-colors flex items-center gap-1 cursor-pointer">
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
              onClick={() => setIsSearchModalOpen(true)}
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

      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        onNavigate={onNavigate} 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8">
        
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#1a1c1b] text-white text-xs px-5 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
            <UserCheck size={16} className="text-botanical-green" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Breadcrumbs / Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-2 text-xs font-sans tracking-wider text-[#747878] uppercase font-medium">
            <button 
              onClick={() => onNavigate('home')} 
              className="hover:text-botanical-green transition-colors"
            >
              Trang chủ
            </button>
            <span>/</span>
            <button 
              onClick={() => onNavigate('list_orchids')} 
              className="hover:text-botanical-green transition-colors"
            >
              Danh Mục Lan
            </button>
            <span>/</span>
            <span className="text-[#1a1c1b] truncate max-w-[200px]">{orchid.name}</span>
          </div>

          <button
            onClick={() => onNavigate('list_orchids')}
            className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#747878] hover:text-botanical-green font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại danh mục</span>
          </button>
        </div>

        {/* Primary detail grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* Left Column: Interactive Image Slider */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="aspect-[4/3] bg-surface-container border border-[#747878]/10 overflow-hidden rounded-md relative shadow-sm">
              <img
                src={images[activeImageIdx]}
                alt={orchid.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-500 ease-out"
              />
            </div>
            
            {/* Thumbnails Row */}
            <div className="grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[4/3] rounded-md overflow-hidden bg-surface-container border-2 transition-all duration-300 cursor-pointer ${
                    idx === activeImageIdx ? 'border-botanical-green opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Key Orchid Attributes */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-charcoal-text tracking-tight font-medium">
                  {orchid.name}
                </h1>
                <p className="font-serif italic text-lg text-[#735c00] mt-1">
                  {orchid.englishName}
                </p>
              </div>

              <p className="font-sans text-xs md:text-[13px] leading-relaxed text-[#1a1c1b]/80">
                {orchid.detailedDescription}
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
                      <td className="py-2.5 text-[#1a1c1b] text-right font-medium">{orchid.isPopular ? 'Dòng lan tiêu biểu' : 'Dòng lan sưu tầm'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions button group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center space-x-2 bg-botanical-green hover:bg-[#3f4b1e] text-white py-3 px-4 rounded-[2px] text-[11px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                <Download size={14} />
                <span>TẢI TÀI LIỆU CHĂM SÓC</span>
              </button>

              <button
                onClick={onToggleBookmark}
                className={`flex items-center justify-center space-x-2 border py-3 px-4 rounded-[2px] text-[11px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 active:scale-[0.98] ${
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

        {/* Decorative botanical divider line */}
        <hr className="border-t border-[#747878]/10 my-12" />

        {/* Section: Biological Highlight */}
        <div className="space-y-8 mb-16">
          <div className="flex items-center space-x-3">
            <span className="h-6 w-[2px] bg-botanical-green" />
            <h2 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-charcoal-text">
              Đặc điểm sinh học nổi bật
            </h2>
          </div>
          
          <p className="font-sans text-[13px] leading-relaxed text-[#1a1c1b]/80 max-w-4xl">
            {orchid.highlightDescription || orchid.detailedDescription}
          </p>

          {/* Light & Temp cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#747878]/10 p-6 rounded-md hover:border-[#56642b]/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-[#56642b]/10 rounded-full text-botanical-green">
                  <Sun size={18} />
                </div>
                <h3 className="font-serif font-medium text-charcoal-text">
                  Cường độ ánh sáng
                </h3>
              </div>
              <p className="font-sans text-xs md:text-[13px] text-[#1a1c1b]/70 leading-relaxed">
                {orchid.lightDetail || "Cần ánh sáng tán xạ (60-70%), tránh trực tiếp để không làm cháy lá."}
              </p>
            </div>

            <div className="bg-white border border-[#747878]/10 p-6 rounded-md hover:border-[#56642b]/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-[#735c00]/10 rounded-full text-[#735c00]">
                  <Thermometer size={18} />
                </div>
                <h3 className="font-serif font-medium text-charcoal-text">
                  Nhiệt độ
                </h3>
              </div>
              <p className="font-sans text-xs md:text-[13px] text-[#1a1c1b]/70 leading-relaxed">
                {orchid.tempDetail || "Phát triển tốt nhất ở nhiệt độ ban ngày từ 25-28°C và ban đêm từ 18-20°C."}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Advanced Care */}
        <div className="space-y-8 mb-16">
          <div className="flex items-center space-x-3">
            <span className="h-6 w-[2px] bg-botanical-green" />
            <h2 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-charcoal-text">
              Kỹ thuật chăm sóc chuyên sâu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f9f9f7] border border-[#747878]/10 p-6 rounded-md relative group hover:bg-white hover:border-[#56642b]/25 transition-all duration-300">
              <span className="absolute top-4 right-4 text-3xl font-serif text-[#735c00]/20 font-bold group-hover:text-[#735c00]/40 transition-colors">
                01
              </span>
              <h3 className="font-serif font-medium text-sm text-charcoal-text mb-2 tracking-wide uppercase">
                1. TƯỚI NƯỚC
              </h3>
              <p className="font-sans text-xs md:text-[13px] text-[#1a1c1b]/70 leading-relaxed mt-4">
                {orchid.watering || "Chỉ tưới khi giá thể đã khô. Sử dụng nước ở nhiệt độ phòng, tưới vào gốc và tránh đọng nước ở kẽ lá."}
              </p>
            </div>
            
            <div className="bg-[#f9f9f7] border border-[#747878]/10 p-6 rounded-md relative group hover:bg-white hover:border-[#56642b]/25 transition-all duration-300">
              <span className="absolute top-4 right-4 text-3xl font-serif text-[#735c00]/20 font-bold group-hover:text-[#735c00]/40 transition-colors">
                02
              </span>
              <h3 className="font-serif font-medium text-sm text-charcoal-text mb-2 tracking-wide uppercase">
                2. BÓN PHÂN
              </h3>
              <p className="font-sans text-xs md:text-[13px] text-[#1a1c1b]/70 leading-relaxed mt-4">
                {orchid.fertilizer || "Sử dụng phân bón chuyên dụng cho hoa lan với hàm lượng NPK cân bằng pha loãng."}
              </p>
            </div>

            <div className="bg-[#f9f9f7] border border-[#747878]/10 p-6 rounded-md relative group hover:bg-white hover:border-[#56642b]/25 transition-all duration-300">
              <span className="absolute top-4 right-4 text-3xl font-serif text-[#735c00]/20 font-bold group-hover:text-[#735c00]/40 transition-colors">
                03
              </span>
              <h3 className="font-serif font-medium text-sm text-charcoal-text mb-2 tracking-wide uppercase">
                3. GIÁ THỂ
              </h3>
              <p className="font-sans text-xs md:text-[13px] text-[#1a1c1b]/70 leading-relaxed mt-4">
                {orchid.soilType || "Ưu tiên vỏ thông, dớn trắng hoặc than củi có độ thoáng khí cao."}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Pests and diseases prevention */}
        <div className="space-y-8 mb-16">
          <div className="bg-[#f9f9f7] border border-[#747878]/10 p-6 md:p-8 rounded-md">
            <h2 className="font-serif text-lg md:text-xl font-medium tracking-tight text-charcoal-text mb-2">
              Phòng trừ sâu bệnh
            </h2>
            <p className="font-sans text-xs text-[#1a1c1b]/60 mb-6 max-w-2xl leading-relaxed">
              {orchid.name} có thể gặp một số sâu bệnh phổ biến dưới đây nếu môi trường xung quanh không được kiểm soát tốt.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-left">
                <thead>
                  <tr className="border-b border-[#747878]/10 text-[10px] uppercase tracking-wider text-[#1a1c1b]/60">
                    <th className="pb-3 font-semibold w-1/4">LOẠI BỆNH</th>
                    <th className="pb-3 font-semibold w-2/5">DẤU HIỆU</th>
                    <th className="pb-3 font-semibold">GIẢI PHÁP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#747878]/10">
                  <tr className="hover:bg-white transition-colors">
                    <td className="py-4 font-semibold text-charcoal-text pr-4">Thối nhũn</td>
                    <td className="py-4 text-[#1a1c1b]/80 pr-4 leading-relaxed">Vết loét ướt, màu nâu trên lá</td>
                    <td className="py-4 text-botanical-green font-medium leading-relaxed">Cắt bỏ phần bệnh, bôi thuốc chống nấm</td>
                  </tr>
                  <tr className="hover:bg-white transition-colors">
                    <td className="py-4 font-semibold text-charcoal-text pr-4">Rệp sáp</td>
                    <td className="py-4 text-[#1a1c1b]/80 pr-4 leading-relaxed">Các đốm trắng như bông trên nách lá</td>
                    <td className="py-4 text-botanical-green font-medium leading-relaxed">Dùng cồn lau sạch hoặc phun thuốc trừ rệp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Decorative botanical divider line */}
        <hr className="border-t border-[#747878]/10 my-12" />

        {/* Section: Community Discussion Forum */}
        <div className="space-y-8 mb-12">
          <div className="flex items-center space-x-3">
            <span className="h-6 w-[2px] bg-botanical-green" />
            <h2 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-charcoal-text">
              Thảo luận cộng đồng
            </h2>
          </div>

          <p className="font-sans text-xs text-[#1a1c1b]/60 -mt-4">
            Chia sẻ kinh nghiệm chăm sóc hoặc đặt câu hỏi về loài lan này cùng cộng đồng Orchidée Luxe.
          </p>

          {/* Comment input form */}
          <div className="bg-white border border-[#747878]/10 p-6 rounded-md">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#56642b]/20 text-botanical-green font-semibold flex items-center justify-center font-sans text-xs flex-shrink-0 shadow-inner">
                  TV
                </div>
                <div className="flex-grow">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ kinh nghiệm hoặc đặt câu hỏi về loài lan này..."
                    rows={3}
                    className="w-full bg-[#f9f9f7] border border-[#747878]/10 hover:border-[#747878]/30 focus:border-botanical-green focus:outline-none rounded-md p-4 text-xs font-sans transition-all resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  disabled={!newComment.trim()}
                  className={`py-2 px-5 text-[10px] tracking-widest font-sans font-semibold uppercase rounded-[2px] transition-all duration-300 ${
                    newComment.trim()
                      ? 'bg-botanical-green text-white hover:bg-[#3f4b1e] shadow-sm active:scale-[0.98]'
                      : 'bg-[#f9f9f7] text-[#1a1c1b]/40 cursor-not-allowed border border-[#747878]/10'
                  }`}
                >
                  GỬI BÌNH LUẬN
                </button>
              </div>
            </div>
          </div>

          {/* Comment threads */}
          <div className="space-y-6">
            {comments.map((comm) => (
              <div key={comm.id} className="border-b border-[#747878]/10 pb-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-white text-[#1a1c1b]/70 border border-[#747878]/20 flex items-center justify-center font-sans text-xs font-medium flex-shrink-0">
                    {comm.author.charAt(0)}
                  </div>
                  <div className="flex-grow space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-charcoal-text font-sans">{comm.author}</span>
                      <span className="text-[10px] text-[#1a1c1b]/40 font-sans">{comm.time}</span>
                    </div>
                    <p className="font-sans text-xs text-[#1a1c1b]/80 leading-relaxed">
                      {comm.content}
                    </p>
                    <div className="flex items-center space-x-4 pt-1">
                      <button className="flex items-center space-x-1.5 text-[10px] font-sans font-medium text-[#1a1c1b]/40 hover:text-[#1a1c1b] transition-colors">
                        <ThumbsUp size={11} />
                        <span>{comm.likes} Thích</span>
                      </button>
                      <button className="text-[10px] font-sans font-medium text-[#1a1c1b]/40 hover:text-[#1a1c1b] transition-colors">
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>

                {comm.replies && comm.replies.length > 0 && (
                  <div className="ml-12 border-l border-[#747878]/20 pl-6 space-y-4 pt-2">
                    {comm.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#56642b]/10 text-botanical-green flex items-center justify-center font-sans text-[10px] font-medium flex-shrink-0">
                          {reply.author.charAt(0)}
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-charcoal-text font-sans">{reply.author}</span>
                            <span className="text-[10px] text-[#1a1c1b]/40 font-sans">{reply.time}</span>
                          </div>
                          <p className="font-sans text-xs text-[#1a1c1b]/80 leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
