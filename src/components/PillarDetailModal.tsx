import { motion } from "motion/react";
import { PillarDetail } from "../types";
import { X, BookOpen, GraduationCap, FolderHeart, ArrowRight } from "lucide-react";
import { useState } from "react";

interface PillarDetailModalProps {
  pillar: PillarDetail;
  onClose: () => void;
}

export default function PillarDetailModal({ pillar, onClose }: PillarDetailModalProps) {
  const [selectedSubItem, setSelectedSubItem] = useState<number | null>(0);

  // Match icon based on pillar id
  const renderIcon = () => {
    switch (pillar.id) {
      case "encyclopedia":
        return <BookOpen className="w-8 h-8 text-botanical-green" />;
      case "manual":
        return <GraduationCap className="w-8 h-8 text-botanical-green" />;
      case "library":
        return <FolderHeart className="w-8 h-8 text-botanical-green" />;
      default:
        return <BookOpen className="w-8 h-8 text-botanical-green" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-surface-cream w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl border border-antique-gold/10 flex flex-col"
      >
        {/* Header section */}
        <div className="p-6 md:p-8 border-b border-surface-container flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-botanical-green/10 rounded-lg">
              {renderIcon()}
            </div>
            <div>
              <h3 className="font-serif text-2xl text-charcoal-text">
                {pillar.title}
              </h3>
              <p className="text-xs text-on-surface-variant font-sans tracking-wide mt-1">
                Chuyên mục khoa học • Orchidée Luxe Research
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-charcoal-text hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content body layout */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-6">
          {/* List of subtopics */}
          <div className="md:w-1/2 flex flex-col gap-3">
            <h4 className="font-sans text-xs uppercase tracking-widest text-[#735c00] font-semibold mb-1">
              Danh mục đề tài nghiên cứu
            </h4>
            {pillar.items.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedSubItem(index)}
                className={`p-4 rounded-lg cursor-pointer transition-all border text-left flex items-start gap-3 relative overflow-hidden ${
                  selectedSubItem === index
                    ? "bg-white border-botanical-green shadow-sm pl-5"
                    : "bg-surface-container-low border-surface-container/60 hover:bg-white"
                }`}
              >
                {selectedSubItem === index && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-botanical-green" />
                )}
                <div className="flex-1">
                  <h5 className="font-serif text-sm text-charcoal-text font-medium group-hover:text-botanical-green">
                    {item.name}
                  </h5>
                  <p className="font-sans text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${
                  selectedSubItem === index ? "text-botanical-green translate-x-1" : "text-on-surface-variant/40"
                }`} />
              </div>
            ))}
          </div>

          {/* Details of selected subtopic */}
          <div className="md:w-1/2 bg-white rounded-lg p-5 border border-surface-container flex flex-col justify-between">
            {selectedSubItem !== null ? (
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-botanical-green bg-botanical-green/10 px-2.5 py-1 rounded">
                  Chi Tiết Tri Thức
                </span>
                <h4 className="font-serif text-base text-charcoal-text leading-tight pt-1">
                  {pillar.items[selectedSubItem].name}
                </h4>
                <p className="font-sans text-xs text-on-surface-variant italic leading-relaxed">
                  "{pillar.items[selectedSubItem].description}"
                </p>
                <div className="p-4 bg-surface-cream text-xs text-on-surface-variant leading-relaxed font-sans rounded border-l-2 border-antique-gold/40">
                  {pillar.items[selectedSubItem].details || "Tài liệu đang tiếp tục cập nhật dữ liệu kỹ thuật lâm học từ nhóm nghiên cứu..."}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#747878] py-12">
                <BookOpen className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-sans">Chọn một đề tài nghiên cứu ở danh mục bên trái để xem tư liệu đầy đủ.</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-surface-container flex justify-between items-center text-[11px] text-on-surface-variant/70 font-sans">
              <span>Được xác nhận bởi Hội đồng Khoa học</span>
              <span className="font-semibold text-botanical-green">Orchidée Luxe</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-surface-container-low p-4 px-6 md:px-8 border-t border-surface-container flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-[#747878]/30 hover:border-charcoal-text text-charcoal-text font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer rounded"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}
