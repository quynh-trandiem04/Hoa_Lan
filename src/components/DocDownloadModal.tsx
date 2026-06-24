import React, { useState, useEffect } from 'react';
import { Loader2, Download, CheckCircle, FileText } from 'lucide-react';

interface DownloadModalProps {
  documentTitle: string;
  format: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DownloadModal({ documentTitle, format, onClose, onSuccess }: DownloadModalProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Đang kết nối thư viện...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Stage update
        if (prev < 30) setStage('Đang xác minh quyền truy cập...');
        else if (prev < 65) setStage(`Đang tải dữ liệu lưu trữ (${format})...`);
        else if (prev < 90) setStage('Đang mã hóa & chuẩn bị file tải về...');
        else setStage('Hoàn tất biên dịch tài liệu.');
        
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [format]);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onSuccess();
        onClose();
        
        // Trigger actual download of a mock text file
        try {
          const blob = new Blob([`Tài liệu: ${documentTitle}\nĐịnh dạng: ${format}\nBản quyền thuộc về Orchidée Luxe Botanical Conservatory.`], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${documentTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${format.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error(e);
        }
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [progress, documentTitle, format, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-charcoal-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-lg shadow-2xl border border-outline-variant/40 relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center rounded-sm">
            <FileText className="w-6 h-6 text-botanical-green" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-charcoal-text font-semibold line-clamp-1">{documentTitle}</h4>
            <p className="text-xs text-outline tracking-wider uppercase font-sans font-medium">Bảo mật học thuật</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center text-sm font-sans mb-2">
            <span className="text-on-surface-variant font-medium">{stage}</span>
            <span className="text-botanical-green font-semibold">{Math.min(progress, 100)}%</span>
          </div>
          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
            <div 
              className="bg-botanical-green h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 font-sans text-xs uppercase tracking-widest">
          {progress < 100 ? (
            <button 
              disabled
              className="flex items-center gap-2 border border-outline-variant text-outline px-4 py-2 cursor-not-allowed"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tải...
            </button>
          ) : (
            <span className="text-botanical-green font-bold flex items-center gap-1.5 py-2">
              <CheckCircle className="w-4 h-4" /> Hoàn tất tải xuống
            </span>
          )}
          <button 
            onClick={onClose}
            className="border border-charcoal-text hover:bg-charcoal-text hover:text-white px-4 py-2 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
