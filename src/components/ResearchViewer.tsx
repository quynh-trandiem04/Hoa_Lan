import { useState } from "react";
import { motion } from "motion/react";
import { researchArticles } from "../data";
import { X, Search, FileText, Calendar, User, AlignLeft, ArrowUpRight } from "lucide-react";

interface ResearchViewerProps {
  onClose: () => void;
}

export default function ResearchViewer({ onClose }: ResearchViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>(researchArticles[0].id);

  const filteredArticles = researchArticles.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    art.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
    art.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeArticle = researchArticles.find(art => art.id === selectedArticleId) || researchArticles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface-cream w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl border border-antique-gold/10 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left Side: Articles list with Search */}
        <div className="w-full md:w-2/5 border-r border-surface-container flex flex-col bg-surface-container-low h-full">
          <div className="p-6 border-b border-surface-container bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl text-charcoal-text">Thư Viện Tài Liệu</h3>
                <p className="text-xs font-sans text-on-surface-variant">Tra cứu nghiên cứu chuyên sâu</p>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-charcoal-text bg-surface-container rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tiêu đề, tác giả hoặc từ khóa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-cream border border-outline-variant/30 focus:border-botanical-green rounded font-sans text-xs outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* List scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`p-4 rounded border text-left cursor-pointer transition-all ${
                    selectedArticleId === art.id
                      ? "bg-white border-botanical-green shadow-sm"
                      : "bg-transparent border-transparent hover:bg-white/50"
                  }`}
                >
                  <span className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 bg-botanical-green/10 text-botanical-green rounded mb-2">
                    {art.category}
                  </span>
                  <h4 className="font-serif text-xs text-charcoal-text font-medium leading-normal hover:text-botanical-green">
                    {art.title}
                  </h4>
                  <p className="font-sans text-[11px] text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                    {art.summary}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-on-surface-variant/60 font-sans">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {art.author.split("-")[0].trim()}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {art.publishedDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-on-surface-variant/60 font-sans">
                <FileText className="w-8 h-8 opacity-40 mx-auto mb-2 animate-pulse" />
                <p className="text-xs">Không tìm thấy tài liệu nghiên cứu phù hợp.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reading Pane */}
        <div className="hidden md:flex flex-1 flex-col h-full bg-white relative">
          {/* Close button for desktop layout */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:text-charcoal-text rounded-full cursor-pointer hover:bg-surface-container"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {activeArticle ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Document Header */}
              <div className="p-8 border-b border-surface-container bg-surface-cream/40 pr-16">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-widest text-[#735c00] font-mono bg-[#735c00]/10 px-2 py-0.5 rounded">
                    TÀI LIỆU KHOA HỌC • {activeArticle.category}
                  </span>
                </div>
                <h2 className="font-serif text-xl md:text-2xl text-charcoal-text leading-snug">
                  {activeArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-sans text-on-surface-variant/80">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal-text">
                    <User className="w-4 h-4 text-botanical-green" /> {activeArticle.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-botanical-green" /> Ngày xuất bản: {activeArticle.publishedDate}
                  </span>
                </div>
              </div>

              {/* Document Content scroll */}
              <div className="flex-1 overflow-y-auto p-8 pr-12 text-on-surface-variant font-sans space-y-6">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-charcoal-text font-bold mb-2.5 flex items-center gap-1.5 font-sans">
                    <AlignLeft className="w-4 h-4 text-botanical-green" /> Tóm tắt Đề Tài (Executive Abstract)
                  </h4>
                  <p className="text-xs italic bg-surface-cream p-4 rounded border-l-2 border-botanical-green leading-relaxed text-charcoal-text">
                    {activeArticle.summary}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-charcoal-text font-bold mb-2 flex items-center gap-1.5 font-sans">
                    <AlignLeft className="w-4 h-4 text-botanical-green" /> Nội Dung Nghiên Cứu Chi Tiết
                  </h4>
                  <p className="text-xs leading-relaxed text-on-surface-variant font-sans whitespace-pre-line">
                    {activeArticle.content}
                  </p>
                  <p className="text-xs leading-relaxed text-on-surface-variant font-sans pt-2">
                    Phong lan (Orchidaceae) đại diện cho đỉnh cao cấu trúc phân hoá hoa hột. Nhóm nghiên cứu thuộc Hội đồng Orchidée Luxe đề xuất việc duy trì phát triển song hành giữa nuôi cấy trong lồng kính bảo ôn và thả tự nhiên để kiểm định tính chống chọi tối ưu của mô di truyền của loài hoang đã đối với biến dị.
                  </p>
                </div>

                {/* Footnote */}
                <div className="pt-8 border-t border-surface-container text-[11px] text-on-surface-variant/60 flex justify-between items-center bg-surface-cream/20 p-4 rounded">
                  <span>Trích dẫn: Orchidée Luxe Botanical Journal Vol. X</span>
                  <span className="flex items-center gap-1 text-[#735c00] hover:underline cursor-pointer">
                    Tải về PDF bản đầy đủ <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-on-surface-variant/50">
              <FileText className="w-12 h-12 opacity-35 mb-2" />
              <p className="text-sm font-sans">Chọn tài liệu khoa học ở phía bên trái để đọc nội dung chi tiết.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
