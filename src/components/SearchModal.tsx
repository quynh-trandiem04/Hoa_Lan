import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LoaderCircle, X } from "lucide-react";
import type { Orchid } from "../types";
import { getOrchids } from "../services/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string, id?: string) => void;
}

export default function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Orchid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = searchQuery.trim();
    if (!isOpen || !query) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      void getOrchids({ pageNumber: 1, pageSize: 20, searchTerm: query, sortBy: "name" })
        .then((items) => {
          if (active) setResults(items);
        })
        .catch((loadError) => {
          if (!active) return;
          setResults([]);
          setError(loadError instanceof Error ? loadError.message : "Không thể tìm kiếm loài lan.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    setResults([]);
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-antique-gold/10 overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between border-b border-surface-container">
              <span className="text-xs font-mono uppercase tracking-widest text-antique-gold font-bold">Tìm kiếm bách khoa toàn thư</span>
              <button 
                onClick={handleClose}
                className="p-1 text-on-surface-variant hover:text-charcoal-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Nhập tên loài lan (ví dụ: hồ điệp, cát lan, phi điệp, đột biến...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-sans p-3 bg-surface-cream rounded border border-outline-variant/30 focus:border-botanical-green outline-none"
                autoFocus
              />
            </div>
            <div className="p-4 pt-1 max-h-60 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-botanical-green">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Đang tìm qua API...
                </div>
              ) : error ? (
                <p className="py-6 text-center text-xs text-red-600">{error}</p>
              ) : searchQuery.trim().length > 0 ? (
                results.length > 0 ? results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.id) onNavigate('orchid_detail', item.id);
                        handleClose();
                      }}
                      className="p-3 bg-surface-cream hover:bg-botanical-green/5 hover:text-botanical-green cursor-pointer rounded flex justify-between items-center group font-sans text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant/70 italic">{item.englishName}</p>
                      </div>
                      {item.hasFragrance && <span className="text-[10px] uppercase font-semibold text-antique-gold">Có hương thơm</span>}
                    </div>
                  )) : (
                    <p className="py-6 text-center text-xs text-on-surface-variant">Không tìm thấy loài lan phù hợp.</p>
                  )
              ) : (
                <p className="text-xs text-on-surface-variant text-center py-4 font-sans">Nhập từ khóa để bắt đầu tra cứu nhanh giống hoa lan...</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
