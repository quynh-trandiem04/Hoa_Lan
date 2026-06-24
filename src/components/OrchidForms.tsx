/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, PlusCircle } from 'lucide-react';
import { Orchid, Category } from '../types';
import { motion } from 'motion/react';

interface AddOrchidModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddOrchid: (orchid: Omit<Orchid, 'id'>) => void;
  editOrchidData?: Orchid | null;
  onEditOrchid?: (id: string, updated: Omit<Orchid, 'id'>) => void;
}

export const AddOrchidModal: React.FC<AddOrchidModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddOrchid,
  editOrchidData = null,
  onEditOrchid
}) => {
  const isEditing = !!editOrchidData;
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [hasFragrance, setHasFragrance] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [slug, setSlug] = useState('');
  const [uploadedImageId, setUploadedImageId] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editOrchidData) {
      setName(editOrchidData.name);
      setEnglishName(editOrchidData.englishName);
      setCategoryId(editOrchidData.categoryIds[0] || '');
      setShortDescription(editOrchidData.shortDescription);
      setDetailedDescription(editOrchidData.detailedDescription);
      setHasFragrance(editOrchidData.hasFragrance);
      setIsPopular(editOrchidData.isPopular);
      setSlug(editOrchidData.slug);
      setUploadedImageId(editOrchidData.uploadedImageIds[0] || '');
      setDisplayOrder(editOrchidData.displayOrder);
    } else {
      setName('');
      setEnglishName('');
      setCategoryId(categories[0]?.id || '');
      setShortDescription('');
      setDetailedDescription('');
      setHasFragrance(false);
      setIsPopular(false);
      setSlug('');
      setUploadedImageId('');
      setDisplayOrder(0);
    }
  }, [editOrchidData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng điền tên loài hoa lan.');
      return;
    }
    if (!englishName.trim()) {
      setErrorMsg('Vui lòng bổ sung tên tiếng Anh / Danh pháp khoa học.');
      return;
    }

    const finalSlug = slug.trim() || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const orchidPayload = {
      name,
      englishName,
      categoryIds: [categoryId],
      shortDescription,
      detailedDescription,
      hasFragrance,
      isPopular,
      slug: finalSlug,
      uploadedImageIds: uploadedImageId ? [uploadedImageId] : [],
      displayOrder
    };

    if (isEditing && editOrchidData && onEditOrchid) {
      onEditOrchid(editOrchidData.id!, orchidPayload);
    } else {
      onAddOrchid(orchidPayload);
    }
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 text-[#56642b]">
            <PlusCircle className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-on-surface">
              {isEditing ? 'Cập Nhật Loài Lan' : 'Thêm Loài Lan Mới'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-error-container/20 border border-error/20 text-error text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên thường gọi *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Hoàng Thảo Kèn"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-[#56642b]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên Tiếng Anh *</label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="Dendrobium nobile Lindl."
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm italic focus:outline-none focus:border-[#56642b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Thuộc Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-[#56642b] text-charcoal-text"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Định danh (Slug)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="vd: hoang-thao-ken (để trống tự tạo)"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-[#56642b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Thứ tự hiển thị</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-[#56642b]"
              />
            </div>
            
            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFragrance}
                  onChange={(e) => setHasFragrance(e.target.checked)}
                  className="w-4 h-4 text-[#56642b] rounded border-outline focus:ring-[#56642b]"
                />
                <span className="text-sm font-semibold text-charcoal-text">Có hương thơm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 text-[#56642b] rounded border-outline focus:ring-[#56642b]"
                />
                <span className="text-sm font-semibold text-charcoal-text">Phổ biến</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Mô tả ngắn</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-[#56642b] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Mô tả chi tiết</label>
            <textarea
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              rows={4}
              className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-[#56642b] resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-1 mt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">ID Ảnh / URL Ảnh</label>
              <input
                type="text"
                value={uploadedImageId}
                onChange={(e) => setUploadedImageId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-[#56642b]"
                placeholder="Nhập link ảnh (hoặc ID ảnh)"
              />
            </div>
            
            {uploadedImageId && uploadedImageId.startsWith('http') && (
              <div className="mt-2 rounded-lg overflow-hidden border border-outline-variant bg-surface-container h-40 w-40">
                <img src={uploadedImageId} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 -mx-6 -mb-6 mt-6 md:sticky md:bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-charcoal-text hover:bg-outline-variant/30 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-[#56642b] hover:bg-[#4a5624] rounded shadow-sm transition-colors"
            >
              {isEditing ? 'LƯU THAY ĐỔI' : 'THÊM MỚI'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id' | 'orchidCount'>) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onAddCategory }) => {
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng cung cấp danh tính chi Lan mới.');
      return;
    }
    setErrorMsg('');
    onAddCategory({ name, scientificName, description });
    // Reset state & close
    setName('');
    setScientificName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-sm w-full overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2 text-botanical-green">
            <FolderPlus className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-on-surface">Thêm Danh Mục Chi Lan</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-2 bg-error-container/20 border border-error/20 text-error text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Tên chi biểu trưng</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phalaenopsis"
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Danh pháp Latinh</label>
            <input
              type="text"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              placeholder="Phalaenopsis Blume"
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm italic focus:outline-none focus:border-botanical-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Mô tả đặc hữu</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Chi phong lan biểu sinh phân bố đa dạng rừng tơ Việt Nam, thích nghi mầm rễ ẩm ướt..."
              className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-botanical-green resize-none text-charcoal-text"
            />
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 -mx-6 -mb-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-botanical-green text-on-secondary font-medium text-xs uppercase hover:opacity-90 transition-all rounded"
            >
              Tạo danh mục
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
