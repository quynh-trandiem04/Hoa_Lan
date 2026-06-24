import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Search, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  Eye, 
  Sparkles,
  BookOpen,
  Sprout,
  User,
  Calendar,
  Database,
  ArrowRight,
  FileText,
  AlertCircle,
  Globe2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';



import DocCard from '../components/DocCard';
import SupportAgent from '../components/DocSupportAgent';
import Toast from '../components/DocToast';
import DownloadModal from '../components/DocDownloadModal';

import { DOCUMENTS } from '../data';
import { OrchidDocument as Document } from '../types';

export default function DocumentPage() {
  // Navigation State
  const [activeScreen, setActiveScreen] = useState<'library' | 'detail'>('library');
  const [selectedDoc, setSelectedDoc] = useState<Document>(DOCUMENTS[0]);

  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Tất cả danh mục');
  const [format, setFormat] = useState('Tất cả định dạng');
  
  // Confirmed Filters (when clicking 'Lọc tài liệu')
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả danh mục');
  const [filterFormat, setFilterFormat] = useState('Tất cả định dạng');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Bookmarks state (saved locally)
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orchidee_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Download simulation State
  const [downloadingDoc, setDownloadingDoc] = useState<Document | null>(null);

  // Lightbox view for details image
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Synchronize bookmarks to storage
  useEffect(() => {
    try {
      localStorage.setItem('orchidee_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarks]);

  // Function to filter documents based on current filter states
  const getFilteredDocs = () => {
    return DOCUMENTS.filter((doc) => {
      // Keyword filter (title, author, publisher, description)
      const matchesKeyword = filterKeyword.trim() === '' || 
        doc.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        doc.author.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        doc.publisher.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        doc.description.toLowerCase().includes(filterKeyword.toLowerCase());

      // Category filter
      const matchesCategory = filterCategory === 'Tất cả danh mục' || doc.category === filterCategory;

      // Format filter
      const matchesFormat = filterFormat === 'Tất cả định dạng' || doc.format.toUpperCase() === filterFormat.toUpperCase();

      return matchesKeyword && matchesCategory && matchesFormat;
    });
  };

  const filteredDocs = getFilteredDocs();
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / itemsPerPage));
  
  // Paginated documents
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Adjust page number if it goes out of range due to filters
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filterKeyword, filterCategory, filterFormat, totalPages, currentPage]);

  const handleApplyFilters = () => {
    setFilterKeyword(keyword);
    setFilterCategory(category);
    setFilterFormat(format);
    setCurrentPage(1);
    showToast('Đã áp dụng các bộ lọc tài liệu!', 'success');
  };

  const handleResetFilters = () => {
    setKeyword('');
    setCategory('Tất cả danh mục');
    setFormat('Tất cả định dạng');
    setFilterKeyword('');
    setFilterCategory('Tất cả danh mục');
    setFilterFormat('Tất cả định dạng');
    setCurrentPage(1);
    showToast('Đã thiết lập lại bộ lọc.', 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const handleToggleBookmark = (docId: string) => {
    if (bookmarks.includes(docId)) {
      setBookmarks(prev => prev.filter(id => id !== docId));
      showToast('Đã xóa tài liệu khỏi thư mục lưu trữ.', 'info');
    } else {
      setBookmarks(prev => [...prev, docId]);
      showToast('Đã lưu tài liệu vào thư mục học thuật thành công!', 'success');
    }
  };

  const handleNavigateToDetail = (doc: Document) => {
    setSelectedDoc(doc);
    setActiveScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLibrary = () => {
    setActiveScreen('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get related documents (different from the currently viewed document)
  const getRelatedDocs = (currentDocId: string) => {
    return DOCUMENTS.filter(doc => doc.id !== currentDocId).slice(0, 3);
  };

  return (
    <div className="bg-surface-cream text-charcoal-text font-sans min-h-screen flex flex-col selection:bg-soft-olive/40 selection:text-botanical-green">
      
      {/* Top Fixed Navbar */}
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
            <a href="/planting-and-care" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Cách trồng và chăm sóc
            </a>
            <button className="font-sans text-xs uppercase tracking-wider font-semibold text-[#56642b] border-b-2 border-[#56642b] pb-1 transition-all cursor-pointer">
              Tài liệu
            </button>
            <a href="/discussion" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Thảo luận
            </a>
          </div>
          <div className="flex items-center space-x-5">
            <button className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Tìm kiếm loài lan">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
            </button>
            <button onClick={() => window.location.href = '/login'} className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Trang quản lý hồ sơ">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-5 h-5" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow mt-16 py-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-16">
          
          <AnimatePresence mode="wait">
            {activeScreen === 'library' ? (
              
              /* ================= SCREEN 1: DOCUMENT LIBRARY ================= */
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >

                {/* Banner & Title */}
                <div className="mb-12 max-w-3xl">
                  <h1 className="font-serif text-3xl md:text-5xl text-charcoal-text font-bold mb-4 tracking-tight leading-tight">
                    Thư Viện Tài Liệu Hoa Lan
                  </h1>
                  <p className="font-sans text-base md:text-lg text-on-surface-variant leading-relaxed">
                    Nơi lưu trữ các nghiên cứu khoa học, sách chuyên khảo và tài liệu kỹ thuật về các loài lan, cung cấp nền tảng kiến thức chuyên sâu cho giới học thuật và người yêu lan.
                  </p>
                  <nav className="flex flex-wrap items-center gap-2 text-xs font-sans uppercase tracking-widest text-outline mb-8 leading-relaxed mt-6">
                    <a href="/" className="hover:text-botanical-green transition-colors font-medium">Trang chủ</a>
                    <ChevronRight className="w-3.5 h-3.5 text-outline/60" />
                    <a href="/document" className="hover:text-botanical-green transition-colors font-medium">Tài nguyên</a>
                  </nav>
                </div>


                {/* Document List */}
                <section className="space-y-6">
                  {paginatedDocs.length > 0 ? (
                    paginatedDocs.map((doc) => (
                      <DocCard 
                        key={doc.id} 
                        doc={doc} 
                        onPreview={handleNavigateToDetail}
                        onDownload={(d) => setDownloadingDoc(d)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-16 bg-surface-container-lowest rounded-lg border border-outline-variant/20 p-8">
                      <AlertCircle className="w-12 h-12 text-outline mx-auto mb-4" />
                      <h3 className="font-serif text-xl font-bold text-charcoal-text mb-2">Không tìm thấy tài liệu phù hợp</h3>
                      <p className="text-on-surface-variant font-sans max-w-md mx-auto mb-6 text-sm">
                        Không có tài liệu nào trùng khớp với từ khóa tìm kiếm hoặc cấu hình bộ lọc hiện tại của bạn.
                      </p>
                      <button 
                        onClick={handleResetFilters}
                        className="bg-botanical-green hover:bg-botanical-green/90 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-2.5 rounded-sm"
                      >
                        Hiển thị tất cả tài liệu
                      </button>
                    </div>
                  )}
                </section>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav className="flex justify-center items-center gap-4 mt-20">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center text-outline hover:text-botanical-green disabled:opacity-40 disabled:hover:text-outline transition-colors cursor-pointer disabled:cursor-not-allowed rounded-full hover:bg-surface-container-low"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button 
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center font-sans text-xs font-bold rounded-sm transition-all select-none ${
                            currentPage === pageNum 
                              ? 'bg-botanical-green text-white shadow-sm' 
                              : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center text-outline hover:text-botanical-green disabled:opacity-40 disabled:hover:text-outline transition-colors cursor-pointer disabled:cursor-not-allowed rounded-full hover:bg-surface-container-low"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                )}

              </motion.div>
            ) : (
              
              /* ================= SCREEN 2: DOCUMENT DETAILS ================= */
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap items-center gap-2 text-xs font-sans uppercase tracking-widest text-outline mb-8 leading-relaxed">
                  <button onClick={handleNavigateToLibrary} className="hover:text-botanical-green transition-colors font-medium">Trang chủ</button>
                  <ChevronRight className="w-3.5 h-3.5 text-outline/60" />
                  <button onClick={handleNavigateToLibrary} className="hover:text-botanical-green transition-colors font-medium">Tài nguyên</button>
                  <ChevronRight className="w-3.5 h-3.5 text-outline/60" />
                  <span className="text-charcoal-text font-bold line-clamp-1 max-w-[280px] md:max-w-none">{selectedDoc.title}</span>
                </nav>

                {/* Document Title */}
                <h1 className="font-serif text-3xl md:text-5xl text-charcoal-text mb-12 max-w-4xl leading-tight font-bold">
                  {selectedDoc.title}
                </h1>

                {/* Two Column Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
                  
                  {/* Left Column (Sidebar PDF details & operations) */}
                  <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
                    <div className="bg-white p-8 luxury-shadow border border-outline-variant/30 flex flex-col items-center text-center">
                      
                      {/* Document mockup visual representation */}
                      <div className="w-32 h-32 bg-surface-container-low flex items-center justify-center mb-6 border border-outline-variant/20 select-none">
                        <FileText className="w-16 h-16 text-botanical-green stroke-[1]" />
                      </div>

                      {/* Info specifications list */}
                      <ul className="w-full space-y-4 mb-8 text-left border-y border-outline-variant/20 py-6 font-sans text-sm">
                        <li className="flex justify-between font-medium">
                          <span className="text-outline">Định dạng</span>
                          <span className="text-charcoal-text font-semibold">{selectedDoc.format} (Digital)</span>
                        </li>
                        <li className="flex justify-between font-medium">
                          <span className="text-outline">Dung lượng</span>
                          <span className="text-charcoal-text font-semibold">{selectedDoc.size}</span>
                        </li>
                        <li className="flex justify-between font-medium">
                          <span className="text-outline">Số trang</span>
                          <span className="text-charcoal-text font-semibold">{selectedDoc.pages} trang</span>
                        </li>
                        <li className="flex justify-between font-medium">
                          <span className="text-outline">Lượt xem</span>
                          <span className="text-charcoal-text font-semibold">{selectedDoc.views.toLocaleString()}</span>
                        </li>
                      </ul>

                      {/* Main action triggers */}
                      <button 
                        onClick={() => setDownloadingDoc(selectedDoc)}
                        className="w-full bg-botanical-green hover:bg-botanical-green/90 text-white py-4 font-sans text-xs uppercase tracking-widest font-bold shadow-sm transition-soft flex items-center justify-center gap-2 select-none cursor-pointer"
                      >
                        <Download className="w-4 h-4 stroke-[2]" /> Tải tài liệu ngay
                      </button>

                      <button 
                        onClick={() => handleToggleBookmark(selectedDoc.id)}
                        className={`w-full mt-4 border py-4 font-sans text-xs uppercase tracking-widest font-bold transition-soft flex items-center justify-center gap-2 select-none cursor-pointer ${
                          bookmarks.includes(selectedDoc.id)
                            ? 'bg-antique-gold/10 border-antique-gold text-antique-gold hover:bg-antique-gold hover:text-white'
                            : 'border-botanical-green text-botanical-green hover:bg-botanical-green hover:text-white'
                        }`}
                      >
                        {bookmarks.includes(selectedDoc.id) ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" /> ĐÃ LƯU TÀI LIỆU
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4" /> LƯU TÀI LIỆU
                          </>
                        )}
                      </button>

                    </div>
                  </aside>

                  {/* Right Column (Bibliographic academic records) */}
                  <article className="lg:col-span-8 flex flex-col">
                    
                    {/* Grid metadata info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 border-b border-outline-variant/30 pb-10 font-sans">
                      <div>
                        <p className="text-xs text-antique-gold uppercase tracking-widest font-bold mb-1.5">Tác giả</p>
                        <p className="font-serif text-lg font-bold text-charcoal-text">{selectedDoc.author}</p>
                      </div>
                      <div>
                        <p className="text-xs text-antique-gold uppercase tracking-widest font-bold mb-1.5">Nhà xuất bản</p>
                        <p className="font-serif text-lg font-bold text-charcoal-text">{selectedDoc.publisher}</p>
                      </div>
                      <div>
                        <p className="text-xs text-antique-gold uppercase tracking-widest font-bold mb-1.5">Năm phát hành</p>
                        <p className="font-serif text-lg font-bold text-charcoal-text">{selectedDoc.year}</p>
                      </div>
                    </div>

                    {/* Executive abstract summary */}
                    <div>
                      <h2 className="font-serif text-xl md:text-2xl text-botanical-green font-bold mb-4">Tóm tắt nội dung</h2>
                      <p className="font-serif text-lg md:text-xl text-on-surface-variant leading-relaxed italic border-l-2 border-antique-gold pl-6 py-1">
                        "{selectedDoc.summary}"
                      </p>
                    </div>

                  </article>

                </div>

                {/* Full Width Academic Content Preview Container */}
                <div className="max-w-[900px] mx-auto bg-white p-8 md:p-16 luxury-shadow border border-outline-variant/20">
                  
                  {/* Table of Contents Box */}
                  <div className="bg-surface-container-low p-8 border border-outline-variant/40 rounded-sm mb-12 font-sans">
                    <h4 className="text-xs uppercase text-charcoal-text tracking-widest font-bold mb-6">Mục lục tài liệu</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedDoc.sections.map((section, idx) => (
                          <tr key={idx} className="border-b border-dashed border-outline-variant/30 last:border-b-0">
                            <td className="py-3 text-on-surface-variant font-medium">{section.title}</td>
                            <td className="py-3 text-right text-charcoal-text font-bold">{section.page}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Rich preview article blocks */}
                  <div className="tinymce-content">
                    {selectedDoc.content.map((block, idx) => {
                      if (block.type === 'heading') {
                        return <h2 key={idx}>{block.text}</h2>;
                      } else if (block.type === 'subheading') {
                        return <h3 key={idx}>{block.text}</h3>;
                      } else if (block.type === 'paragraph') {
                        return <p key={idx}>{block.text}</p>;
                      } else if (block.type === 'list' && block.items) {
                        return (
                          <ul key={idx}>
                            {block.items.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        );
                      } else if (block.type === 'image' && block.url) {
                        return (
                          <div key={idx} className="my-12">
                            <div className="relative group cursor-zoom-in overflow-hidden" onClick={() => setIsLightboxOpen(true)}>
                              <img 
                                src={block.url} 
                                alt={block.caption || selectedDoc.title} 
                                className="w-full h-[320px] md:h-[500px] object-cover luxury-shadow group-hover:scale-102 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-charcoal-text/0 group-hover:bg-charcoal-text/10 transition-colors flex items-center justify-center">
                                <span className="bg-white/90 text-charcoal-text text-xs tracking-wider uppercase font-sans font-bold px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm shadow-sm">
                                  Phóng to hình ảnh
                                </span>
                              </div>
                            </div>
                            {block.caption && (
                              <p className="text-xs font-sans text-center mt-4 text-outline italic leading-normal">
                                {block.caption}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                </div>

                {/* Related Resources Subsection */}
                <section className="mt-24 border-t border-outline-variant/20 pt-20">
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h2 className="font-serif text-2xl md:text-3xl text-charcoal-text font-bold mb-2">Tài liệu liên quan</h2>
                      <p className="text-on-surface-variant max-w-md font-sans text-sm">
                        Khám phá thêm các nghiên cứu chuyên sâu về hệ sinh thái thực vật và kỹ thuật bảo tồn đỉnh cao.
                      </p>
                    </div>
                    <button 
                      onClick={handleNavigateToLibrary}
                      className="font-sans text-xs uppercase text-antique-gold font-bold tracking-wider border-b border-antique-gold pb-1 hover:text-botanical-green hover:border-botanical-green transition-colors"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {getRelatedDocs(selectedDoc.id).map((relatedDoc) => (
                      <div 
                        key={relatedDoc.id}
                        onClick={() => handleNavigateToDetail(relatedDoc)}
                        className="group cursor-pointer flex flex-col"
                      >
                        <div className="relative overflow-hidden mb-6 aspect-[3/4] bg-surface-container-low border border-outline-variant/20 rounded-sm">
                          <img 
                            src={relatedDoc.imageUrl} 
                            alt={relatedDoc.imageAlt} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-botanical-green text-white px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm">
                              {relatedDoc.format}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-serif text-lg text-charcoal-text font-bold mb-1.5 group-hover:text-antique-gold transition-colors line-clamp-2">
                          {relatedDoc.title}
                        </h3>
                        <p className="text-outline font-sans text-xs uppercase tracking-widest font-semibold">
                          {relatedDoc.author} • {relatedDoc.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>


      {/* Footer component */}
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

      {/* Lightbox Modal Component */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-charcoal-text/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="max-w-5xl w-full text-center relative">
            <img 
              src={selectedDoc.imageUrl} 
              alt={selectedDoc.imageAlt} 
              className="max-h-[85vh] max-w-full mx-auto object-contain shadow-2xl border border-white/10"
            />
            <p className="text-white/80 font-sans text-xs mt-4 italic max-w-xl mx-auto leading-relaxed">
              {selectedDoc.title} - Trích lục lưu trữ chất lượng cao Orchidée Luxe.
            </p>
            <button 
              className="absolute top-0 right-0 text-white/60 hover:text-white p-2 text-sm uppercase tracking-wider font-sans font-bold"
              onClick={() => setIsLightboxOpen(false)}
            >
              Đóng [X]
            </button>
          </div>
        </div>
      )}

      {/* Global Download Simulation modal */}
      {downloadingDoc && (
        <DownloadModal 
          documentTitle={downloadingDoc.title}
          format={downloadingDoc.format}
          onClose={() => setDownloadingDoc(null)}
          onSuccess={() => showToast(`Tải xuống "${downloadingDoc.title}" thành công!`, 'success')}
        />
      )}

      {/* Toast notifications */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage(null)} 
        />
      )}

    </div>
  );
}
