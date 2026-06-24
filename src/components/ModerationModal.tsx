import React from 'react';
import { X, CheckCircle, Ban, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityPost } from '../types';

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CommunityPost | null; // renamed inside App.tsx, but passed as `report` prop
  onIgnore: (id: string) => void; // mapped to handleApprovePost
  onWarn: (id: string) => void;   // not used
  onBan: (id: string) => void;    // mapped to handleRejectPost
}

export function ModerationModal({ isOpen, onClose, report, onIgnore, onBan }: ModerationModalProps) {
  if (!report) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-[#f4f4f2]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#56642b]/10 text-[#56642b] flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-on-surface leading-tight">
                      Kiểm duyệt bài viết #{report.id}
                    </h3>
                    <p className="text-[10px] text-outline font-mono uppercase tracking-wider">
                      Đăng lúc: {report.timeAgo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* User Info */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/50 bg-[#f9f9f7]">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${report.avatarColor}`}>
                    {report.avatarLetter}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-charcoal-text text-sm">{report.author}</h4>
                    <p className="text-xs text-outline mt-0.5">{report.authorRole}</p>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-outline tracking-wider mb-2">Nội dung bài viết</h4>
                  <div className="p-4 bg-[#f4f4f2] rounded-xl text-sm text-charcoal-text border border-outline-variant/30 leading-relaxed whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>

                {/* Attached Image/Media */}
                {report.imageUrl && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-outline tracking-wider mb-2">Ảnh đính kèm</h4>
                    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-[#f4f4f2] flex justify-center">
                      <img src={report.imageUrl} alt="Attached media" className="max-h-[300px] object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-outline-variant/30 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => onBan(report.id)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-error/10 text-error hover:bg-error hover:text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  Từ chối (Reject)
                </button>
                <button
                  onClick={() => onIgnore(report.id)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#56642b] text-white hover:bg-[#434748] rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Duyệt bài (Approve)
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
