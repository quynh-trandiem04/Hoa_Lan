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
  onAddOrchid: (orchid: Omit<Orchid, 'id'>) => Promise<void>;
  editOrchidData?: Orchid | null;
  onEditOrchid?: (id: string, updated: Omit<Orchid, 'id'>) => Promise<void>;
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
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [hasFragrance, setHasFragrance] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [slug, setSlug] = useState('');
  const [uploadedImageIdsText, setUploadedImageIdsText] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editOrchidData) {
      setName(editOrchidData.name);
      setEnglishName(editOrchidData.englishName);
      setCategoryIds(editOrchidData.categoryIds);
      setShortDescription(editOrchidData.shortDescription);
      setDetailedDescription(editOrchidData.detailedDescription);
      setHasFragrance(editOrchidData.hasFragrance);
      setIsPopular(editOrchidData.isPopular);
      setSlug(editOrchidData.slug);
      setUploadedImageIdsText(editOrchidData.uploadedImageIds.join('\n'));
      setDisplayOrder(editOrchidData.displayOrder);
    } else {
      setName('');
      setEnglishName('');
      setCategoryIds([]);
      setShortDescription('');
      setDetailedDescription('');
      setHasFragrance(false);
      setIsPopular(false);
      setSlug('');
      setUploadedImageIdsText('');
      setDisplayOrder(0);
    }
  }, [editOrchidData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng điền tên loài hoa lan.');
      return;
    }
    if (!englishName.trim()) {
      setErrorMsg('Vui lòng bổ sung tên tiếng Anh / Danh pháp khoa học.');
      return;
    }
    if (categoryIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một danh mục cho hoa lan.');
      return;
    }
    const uploadedImageIds = Array.from(new Set(uploadedImageIdsText
      .split(/[\s,;]+/)
      .map((id) => id.trim())
      .filter(Boolean)));
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uploadedImageIds.some((id) => !uuidPattern.test(id))) {
      setErrorMsg('Danh sách ảnh chứa UUID không hợp lệ.');
      return;
    }

    const finalSlug = slug.trim() || name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const orchidPayload = {
      name: name.trim(),
      englishName: englishName.trim(),
      categoryIds,
      shortDescription: shortDescription.trim(),
      detailedDescription: detailedDescription.trim(),
      hasFragrance,
      isPopular,
      slug: finalSlug,
      uploadedImageIds,
      displayOrder
    };

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (isEditing && editOrchidData && onEditOrchid) {
        await onEditOrchid(editOrchidData.id!, orchidPayload);
      } else {
        await onAddOrchid(orchidPayload);
      }
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể lưu thông tin hoa lan.');
    } finally {
      setIsSubmitting(false);
    }
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

          <div>
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên tiếng Anh / Danh pháp khoa học *</label>
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Thuộc danh mục *</label>
              <div className="max-h-32 overflow-y-auto bg-surface-container-low border border-outline-variant rounded px-3 py-2 space-y-2">
                {categories.length === 0 && (
                  <p className="text-xs text-outline">Chưa có danh mục. Hãy tạo danh mục trước.</p>
                )}
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm text-charcoal-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(cat.id)}
                      onChange={(e) => setCategoryIds((current) => e.target.checked
                        ? [...current, cat.id]
                        : current.filter((id) => id !== cat.id))}
                      className="w-4 h-4 text-[#56642b] rounded border-outline focus:ring-[#56642b]"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-outline">Có thể chọn nhiều danh mục.</p>
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Danh sách ID ảnh đã tải lên (UUID)</label>
              <textarea
                value={uploadedImageIdsText}
                onChange={(e) => setUploadedImageIdsText(e.target.value)}
                rows={3}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#56642b] resize-y"
                placeholder={'Mỗi UUID một dòng, ví dụ:\n3fa85f64-5717-4562-b3fc-2c963f66afa6'}
              />
              <p className="text-[10px] text-outline">Nhập nhiều UUID, ngăn cách bằng xuống dòng, dấu phẩy hoặc dấu chấm phẩy.</p>
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 -mx-6 -mb-6 mt-6 md:sticky md:bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-charcoal-text hover:bg-outline-variant/30 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-bold text-white bg-[#56642b] hover:bg-[#4a5624] rounded shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'ĐANG LƯU...' : (isEditing ? 'LƯU THAY ĐỔI' : 'THÊM MỚI')}
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
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id' | 'orchidCount'>) => Promise<void>;
  editCategoryData?: Category | null;
  onEditCategory?: (id: string, category: Omit<Category, 'id' | 'orchidCount'>) => Promise<void>;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  editCategoryData,
  onEditCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(editCategoryData?.name ?? '');
    setDescription(editCategoryData?.description ?? '');
    setParentId(editCategoryData?.parentId ?? '');
    setErrorMsg('');
  }, [isOpen, editCategoryData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng cung cấp danh tính chi Lan mới.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        parentId: parentId || null,
        slug: editCategoryData?.slug,
      };
      if (editCategoryData && onEditCategory) {
        await onEditCategory(editCategoryData.id, payload);
      } else {
        await onAddCategory(payload);
      }
      setName('');
      setDescription('');
      setParentId('');
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể tạo danh mục mới.');
    } finally {
      setIsSubmitting(false);
    }
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
            <h3 className="font-serif text-lg font-bold text-on-surface">
              {editCategoryData ? 'Chỉnh Sửa Danh Mục Chi Lan' : 'Thêm Danh Mục Chi Lan'}
            </h3>
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Danh mục cha</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
            >
              <option value="">Không có — danh mục cấp gốc</option>
              {categories.filter((category) => category.id !== editCategoryData?.id).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
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
              disabled={isSubmitting}
              className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-botanical-green text-on-secondary font-medium text-xs uppercase hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all rounded"
            >
              {isSubmitting
                ? (editCategoryData ? 'Đang lưu...' : 'Đang tạo...')
                : (editCategoryData ? 'Lưu thay đổi' : 'Tạo danh mục')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
