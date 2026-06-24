import { motion } from "motion/react";
import { OrchidItem } from "../types";
import { X, Droplet, Sun, Thermometer, ShieldAlert, Layers, MapPin, Beaker } from "lucide-react";

interface OrchidDetailModalProps {
  orchid: OrchidItem;
  onClose: () => void;
}

export default function OrchidDetailModal({ orchid, onClose }: OrchidDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-surface-cream w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-antique-gold/10 flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Section */}
        <div className="md:w-1/2 relative bg-surface-container overflow-hidden min-h-[300px] md:min-h-full">
          <img
            src={orchid.image}
            alt={orchid.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
            <span className="text-xs uppercase tracking-widest text-soft-olive font-mono mb-2">
              {orchid.scientificName}
            </span>
            <h3 className="font-serif text-3xl text-white mb-1">
              {orchid.name}
            </h3>
            <p className="text-white/80 text-sm font-sans italic">
              Việt danh: {orchid.vietnameseName}
            </p>
          </div>
        </div>

        {/* Detailed Information Section */}
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-botanical-green/10 text-botanical-green text-xs font-mono rounded">
                <MapPin className="w-3.5 h-3.5" /> {orchid.origin.split(",")[0]}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-antique-gold/15 text-antique-gold text-xs font-mono rounded">
                <ShieldAlert className="w-3.5 h-3.5" /> Dòng quý tộc
              </span>
            </div>

            <p className="font-sans text-sm text-on-surface-variant leading-relaxed mb-6">
              {orchid.longDescription}
            </p>

            <h4 className="font-serif text-lg text-charcoal-text border-b border-antique-gold/10 pb-2 mb-4">
              Cẩm Nang Nuôi Trồng Lâm Khoa
            </h4>

            {/* Grid of conditions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1.5 text-botanical-green font-medium text-xs uppercase tracking-wider">
                  <Droplet className="w-4 h-4" /> tưới nước
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {orchid.watering}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1.5 text-antique-gold font-medium text-xs uppercase tracking-wider">
                  <Sun className="w-4 h-4" /> ánh sáng
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {orchid.light}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1.5 text-orange-600 font-medium text-xs uppercase tracking-wider">
                  <Thermometer className="w-4 h-4" /> nhiệt độ
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {orchid.temperature}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1.5 text-blue-600 font-medium text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" /> giá thể
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {orchid.soilType}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans text-on-surface-variant/90">
              <p className="flex justify-between py-1.5 border-b border-surface-container">
                <span className="font-semibold text-charcoal-text">Phân bón khuyên dùng:</span>
                <span>{orchid.fertilizer}</span>
              </p>
              <p className="flex justify-between py-1.5">
                <span className="font-semibold text-charcoal-text">Trạng thái bảo tồn hoang dã:</span>
                <span className="text-rose-600 font-medium">{orchid.conservationStatus}</span>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-surface-container flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-botanical-green hover:bg-botanical-green/90 text-white font-sans text-xs uppercase tracking-widest transition-all cursor-pointer rounded"
            >
              Đóng Cẩm Nang
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
