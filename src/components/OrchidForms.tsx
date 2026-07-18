/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, PlusCircle, Upload, Trash2 } from 'lucide-react';
import { Orchid, Category } from '../types';
import { motion } from 'motion/react';
import { deleteUploadedImage, uploadImage, type UploadedImage } from '../services/api';

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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
      setUploadedImages(editOrchidData.uploadedImageIds.map((id) => ({ id, publicId: '', url: '' })));
    } else {
      setName('');
      setEnglishName('');
      setCategoryIds([]);
      setShortDescription('');
      setDetailedDescription('');
      setHasFragrance(false);
      setIsPopular(false);
      setSlug('');
      setUploadedImages([]);
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
      uploadedImageIds: uploadedImages.map((image) => image.id),
      displayOrder: editOrchidData?.displayOrder ?? 0,
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

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setErrorMsg('Vui lòng chỉ chọn tệp hình ảnh.');
      return;
    }

    setErrorMsg('');
    setIsUploadingImages(true);
    try {
      for (const file of files) {
        const uploaded = await uploadImage(file);
        setUploadedImages((current) => current.some((image) => image.id === uploaded.id)
          ? current
          : [...current, uploaded]);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = async (image: UploadedImage) => {
    setErrorMsg('');
    try {
      if (image.publicId) await deleteUploadedImage(image.publicId);
      setUploadedImages((current) => current.filter((item) => item.id !== image.id));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể xóa ảnh.');
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

          <div className="flex items-center gap-6">
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

          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Hình ảnh hoa lan</label>
            <label className={`w-full min-h-24 border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center gap-2 text-sm transition-colors ${
              isUploadingImages ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-[#56642b] hover:bg-[#f7f8f2]'
            }`}>
              <Upload className="w-5 h-5 text-[#56642b]" />
              <span className="font-semibold text-charcoal-text">
                {isUploadingImages ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính'}
              </span>
              <span className="text-[10px] text-outline">Có thể chọn nhiều ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isUploadingImages || isSubmitting}
                onChange={(event) => void handleUploadImages(event)}
                className="sr-only"
              />
            </label>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low min-h-28">
                    {image.url ? (
                      <img src={image.url} alt={image.fileName || 'Ảnh hoa lan'} className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-28 p-3 flex items-center justify-center text-center text-[10px] text-outline break-all">
                        Ảnh đã liên kết<br />{image.id}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage(image)}
                      disabled={isUploadingImages || isSubmitting}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 text-error shadow hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                      title="Xóa ảnh"
                      aria-label={`Xóa ${image.fileName || image.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 -mx-6 -mb-6 mt-6 md:sticky md:bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingImages}
              className="px-4 py-2 text-sm font-semibold text-charcoal-text hover:bg-outline-variant/30 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImages}
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
