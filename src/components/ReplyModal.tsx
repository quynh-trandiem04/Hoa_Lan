/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Sparkles, BookOpen } from 'lucide-react';
import { Question } from '../types';
import { motion } from 'motion/react';

interface ReplyModalProps {
  question: Question | null;
  onClose: () => void;
  onSubmitReply: (questionId: string, replyContent: string) => void;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({ question, onClose, onSubmitReply }) => {
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!question) return null;

  const presets = [
    {
      title: "Cattleya nở tết",
      text: "Để Cattleya ra hoa đúng Tết cổ truyền, cần chú ý xiết nước nhẹ từ giữa tháng 8 âm lịch, bổ sung thêm phân bón có nồng độ lân cao (ví dụ: 10-52-10) đều đặn mỗi tuần để kích mầm hoa dồi dào."
    },
    {
      title: "Lan bị vàng lá",
      text: "Hầu hết hiện tượng vàng rụng lá bắt nguồn từ độ ẩm rễ quá rậm rạp làm trũng oxy rễ. Hãy giãn chu kỳ tưới tiêu, chuyển lan sang đặt tại khu vực giàn thoáng gió, rải vôi bột nhẹ quanh giá thể."
    },
    {
      title: "Nhiệt độ Hồ Điệp",
      text: "Nhiệt độ lý tưởng bậc nhất cho lan Hồ Điệp duy trì biên độ ngày từ 24-28°C và ban đêm từ 18-20°C. Chênh lệch nhiệt độ ngày đêm khoảng 8°C chính là điều kiện mấu chốt kích hoa."
    }
  ];

  const handlePresetClick = (text: string) => {
    setReplyText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setErrorMsg('Vui lòng soạn văn bản trả lời trước khi gửi.');
      return;
    }
    setErrorMsg('');
    onSubmitReply(question.id, replyText);
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2 text-botanical-green">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-on-surface">Phản Hồi Câu Hỏi Trực Tuyến</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* The Question Card */}
            <div className="p-4 bg-surface-container-low border border-outline-variant/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${question.avatarColor}`}>
                  {question.avatarLetter}
                </div>
                <span className="text-xs font-bold text-on-surface">{question.sender}</span>
                <span className="text-[10px] text-outline ml-auto font-mono">{question.timeAgo}</span>
              </div>
              <p className="text-sm font-medium text-charcoal-text italic">
                "{question.content}"
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-error-container/20 border border-error/20 text-error text-xs rounded">
                {errorMsg}
              </div>
            )}

            {/* Response presets */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-antique-gold shrink-0" />
                Dùng câu trả lời nhanh mẫu chuẩn
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetClick(preset.text)}
                    className="px-2.5 py-1 bg-soft-olive/15 hover:bg-soft-olive/35 text-on-secondary-container text-xs rounded transition-all border border-secondary/10"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Response form field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Văn bản soạn thảo</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                placeholder="Nhập câu trả lời chi tiết tại đây..."
                className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-botanical-green resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-botanical-green text-on-secondary font-medium text-xs uppercase hover:opacity-90 transition-all rounded flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi câu trả lời
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
