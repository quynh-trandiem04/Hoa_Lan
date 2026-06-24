/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface DocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (filename: string) => void;
}

export const DocUploadModal: React.FC<DocUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(-1); // -1 means idle
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.pdf', '.docx', '.zip'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      setErrorMsg('Tập tin không hợp lệ. Vui lòng chỉ tải lên tài liệu .PDF, .DOCX hoặc .ZIP.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
      setErrorMsg('Kích thước tập tin vượt quá hạn mức cho phép (Tối đa 50MB).');
      setFile(null);
      return;
    }

    setErrorMsg('');
    setFile(selectedFile);
    simulateProgress(selectedFile.name);
  };

  const simulateProgress = (name: string) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onUploadSuccess(name);
            onClose();
            // Reset state
            setFile(null);
            setUploadProgress(-1);
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-on-surface">Tải Lên Tài Liệu Lưu Trữ</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
            Lưu trữ kỹ thuật số các bản báo cáo sinh trắc học, chứng nhận lai tạo hoặc danh sách phân phối hạt giống lan quý giá. Tập tin sẽ được gắn kết trực tiếp với dữ liệu lưu trữ quốc tế cao cấp.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.zip"
            onChange={handleChange}
          />

          {uploadProgress === -1 && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                dragActive 
                  ? 'border-antique-gold bg-soft-olive/10' 
                  : 'border-outline-variant hover:border-botanical-green hover:bg-surface-container-low'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-soft-olive/10 flex items-center justify-center text-botanical-green">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-on-surface">
                  Thả tập tin tại đây hoặc <span className="text-botanical-green hover:underline">nhấp để tìm</span>
                </p>
                <p className="text-xs text-outline mt-1 font-mono">PDF, DOCX hoặc ZIP tối đa 50MB</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-3 bg-error-container/20 border border-error/20 rounded-lg flex items-start gap-2 text-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploadProgress >= 0 && (
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-botanical-green/10 flex items-center justify-center text-botanical-green rounded-lg shrink-0">
                  <File className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {file?.name || "tai_lieu_luu_tru.pdf"}
                  </p>
                  <p className="text-[10px] text-outline font-mono mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Đang tính toán..."}
                  </p>
                </div>
                <span className="text-xs font-bold text-botanical-green font-mono">
                  {uploadProgress}%
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-botanical-green h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <div className="text-[10px] text-outline flex items-center gap-1.5">
                {uploadProgress < 100 ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-antique-gold rounded-full animate-ping" />
                    <span>Hệ thống đang mã hóa tập tin bảo mật cao...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="text-secondary font-medium">Lưu trữ thành công! Đang đồng bộ hóa...</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploadProgress >= 0}
            className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all"
          >
            Hủy bỏ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
