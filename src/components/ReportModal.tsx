/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, Award, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedChartIndex, setSelectedChartIndex] = useState<number>(0);
  
  if (!isOpen) return null;

  const dataset = [
    {
      year: "2024 Q1",
      cattleyaPrice: 420000,
      wildOrchidPrice: 680000,
      demandIndex: 72,
    },
    {
      year: "2024 Q2",
      cattleyaPrice: 490000,
      wildOrchidPrice: 710000,
      demandIndex: 78,
    },
    {
      year: "2024 Q3",
      cattleyaPrice: 530000,
      wildOrchidPrice: 890000,
      demandIndex: 85,
    },
    {
      year: "2024 Q4",
      cattleyaPrice: 610000,
      wildOrchidPrice: 1200000,
      demandIndex: 94,
    },
    {
      year: "2025 H1",
      cattleyaPrice: 750000,
      wildOrchidPrice: 1450000,
      demandIndex: 98,
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-cream rounded-xl shadow-2xl border border-outline-variant max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-cream/95 backdrop-blur-md px-6 py-5 border-b border-outline-variant flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-antique-gold/10 text-antique-gold text-[10px] font-bold uppercase tracking-widest rounded-sm">
                Bản báo cáo cao cấp
              </span>
              <Sparkles className="w-3.5 h-3.5 text-antique-gold animate-pulse" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-botanical-green mt-1">
              Phân Tích Thị Trường Hoa Lan 2024 - 2026
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Bản báo cáo kỹ thuật tổng quát này phác họa biến động giao dịch, giá trị đấu giá tầm cỡ quốc tế đối với dòng <strong>Lan Cattleya lai cao cấp</strong> và các giống <strong>Lan rừng tự nhiên đột biến (Lan Var)</strong> đặc chủng tại bán đảo Đông Dương.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-outline-variant/50 rounded-lg">
              <p className="text-[10px] uppercase text-outline font-semibold tracking-wider">Cực điểm giao dịch</p>
              <p className="text-xl font-serif text-botanical-green font-bold mt-1">1.450.000 ₫</p>
              <p className="text-xs text-outline mt-1">Giá trung bình mỗi nhánh Lan Var</p>
            </div>
            <div className="p-4 bg-white border border-outline-variant/50 rounded-lg">
              <p className="text-[10px] uppercase text-outline font-semibold tracking-wider font-sans">Mức tăng trưởng</p>
              <div className="flex items-center gap-1 mt-1 text-secondary">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <p className="text-xl font-serif font-bold">+24.5%</p>
              </div>
              <p className="text-xs text-outline mt-1">Nhu cầu sưu tầm tăng vọt</p>
            </div>
            <div className="p-4 bg-white border border-outline-variant/50 rounded-lg">
              <p className="text-[10px] uppercase text-outline font-semibold tracking-wider">Nhóm sưu tập số 1</p>
              <p className="text-xl font-serif text-antique-gold font-bold mt-1">Hoàng Thảo</p>
              <p className="text-xs text-outline mt-1">Dendrobium giữ ngôi vương</p>
            </div>
          </div>

          {/* Chart Controls & Visualization */}
          <div className="p-5 bg-white border border-outline-variant/60 rounded-xl">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase text-charcoal-text tracking-wider">Biểu đồ ước lượng giá (VND)</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setSelectedChartIndex(0)}
                  className={`px-3 py-1 text-xs rounded transition-all ${selectedChartIndex === 0 ? 'bg-botanical-green text-white font-medium' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                >
                  Lan Rừng Đột Biến
                </button>
                <button 
                  onClick={() => setSelectedChartIndex(1)}
                  className={`px-3 py-1 text-xs rounded transition-all ${selectedChartIndex === 1 ? 'bg-botanical-green text-white font-medium' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                >
                  Cattleya Premium
                </button>
              </div>
            </div>

            {/* Simulated Clean SVG Line Chart */}
            <div className="h-44 w-full flex items-end justify-between relative pt-6 border-b border-l border-outline-variant p-2">
              {/* Y Axis Guides */}
              <div className="absolute left-1 top-2 text-[8px] text-outline font-mono">1.6M</div>
              <div className="absolute left-1 top-22 text-[8px] text-outline font-mono">800K</div>
              <div className="absolute left-1 bottom-1 text-[8px] text-outline font-mono">0</div>

              {/* Dynamic SVGs rendering price trends */}
              <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" preserveAspectRatio="none">
                {selectedChartIndex === 0 ? (
                  <>
                    {/* Rare Wild Orchid Path */}
                    <path
                      d="M 40 140 Q 150 120 300 80 T 600 20"
                      fill="none"
                      stroke="#735c00"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="40" cy="140" r="5" fill="#735c00" />
                    <circle cx="300" cy="80" r="5" fill="#735c00" />
                    <circle cx="600" cy="20" r="5" fill="#56642b" className="animate-ping" />
                    <circle cx="600" cy="20" r="5" fill="#735c00" />
                  </>
                ) : (
                  <>
                    {/* Cattleya Path */}
                    <path
                      d="M 40 120 Q 150 110 300 90 T 600 50"
                      fill="none"
                      stroke="#56642b"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="40" cy="120" r="5" fill="#56642b" />
                    <circle cx="300" cy="90" r="5" fill="#56642b" />
                    <circle cx="600" cy="50" r="5" fill="#56642b" />
                  </>
                )}
              </svg>

              {/* X Axis Labels */}
              {dataset.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center z-10 w-12 text-center">
                  <span className="text-[10px] font-mono font-medium text-charcoal-text">
                    {selectedChartIndex === 0 ? formatCurrency(data.wildOrchidPrice).split(',')[0] + 'đ' : formatCurrency(data.cattleyaPrice).split(',')[0] + 'đ'}
                  </span>
                  <span className="text-[9px] text-outline mt-1 font-bold">{data.year}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-outline flex items-center gap-1 justify-center">
              <Info className="w-3 h-3 text-antique-gold" />
              <span>Biểu đồ dựa trên dữ liệu giao dịch chính quy của Nghiệp đoàn Phong lan Việt Nam (VOAs).</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-lg font-medium text-charcoal-text">Chiến lược đề xuất cho Admin</h4>
            <ul className="text-sm text-on-surface-variant space-y-2 list-disc pl-5">
              <li><strong>Ưu sinh hạt giống Dendrobium:</strong> Do biến đổi khí hậu khiến các dòng Lan rừng nguyên tác héo rũ, tập trung bảo tồn mô rễ trong phòng sạch là mục tiêu hàng đầu.</li>
              <li><strong>Tái phân chia vùng nhiệt đới:</strong> Lan Vũ Nữ (Oncidium) cho thấy phản ứng nhạy cảm nhất đối với ẩm độ biến thiên, cần bổ sung cảm biến độ ẩm trước quý 3.</li>
              <li><strong>Tận dụng kênh đấu giá lưu trữ:</strong> Nhập thông tin minh bạch về giấy tờ xuất xứ nguồn lan rừng để gia tăng uy tín quản lý lưu trữ.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline-variant bg-surface-container-low flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-botanical-green text-on-secondary hover:opacity-90 font-medium text-sm rounded transition-all"
          >
            Đóng báo cáo
          </button>
        </div>
      </motion.div>
    </div>
  );
};
