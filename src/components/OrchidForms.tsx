/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FolderPlus, PlusCircle, Upload, Trash2, Leaf, Star, Check, Flower2, Sun, Snowflake, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Orchid, Category, Region, BloomSeason, FlowerColor } from '../types';
import { motion } from 'motion/react';
import { deleteUploadedImage, uploadImage, type UploadedImage } from '../services/api';
import { getOrchidImageUrls } from '../utils/orchidImages';
import { toRichTextHtml } from '../utils/richText';
import CategoryTreeSelect from './CategoryTreeSelect';
import LocalRichTextEditor from './LocalRichTextEditor';

const flowerColorLabels: Record<string, string> = {
  RED: 'Đỏ',
  ORANGE: 'Cam',
  YELLOW: 'Vàng',
  WHITE: 'Trắng',
  PINK: 'Hồng',
  PURPLE: 'Tím',
  GREEN: 'Xanh lá',
  LIGHT_GREEN: 'Xanh nhạt',
  BLUE: 'Xanh dương',
  CREAM: 'Kem',
  BROWN: 'Nâu',
  BLACK: 'Đen',
};

const bloomSeasonIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SPRING: Flower2,
  SUMMER: Sun,
  AUTUMN: Leaf,
  WINTER: Snowflake,
  ALL_YEAR: RefreshCw,
};

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
  const [regions, setRegions] = useState<string[]>([]);
  const [bloomSeasons, setBloomSeasons] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editOrchidData) {
      setName(editOrchidData.name);
      setEnglishName(editOrchidData.englishName);
      setCategoryIds(editOrchidData.categoryIds);
      setShortDescription(editOrchidData.shortDescription);
      setDetailedDescription(toRichTextHtml(editOrchidData.detailedDescription));
      setHasFragrance(editOrchidData.hasFragrance);
      setIsPopular(editOrchidData.isPopular);
      setSlug(editOrchidData.slug);
      setRegions((editOrchidData.regions || []) as string[]);
      setBloomSeasons((editOrchidData.bloomSeasons || []) as string[]);
      setColors((editOrchidData.colors || []) as string[]);
      const existingUrls = getOrchidImageUrls(editOrchidData);
      setUploadedImages(editOrchidData.uploadedImageIds.map((id, index) => ({
        id,
        publicId: '',
        url: existingUrls[index] ?? '',
      })));
    } else {
      setName('');
      setEnglishName('');
      setCategoryIds([]);
      setShortDescription('');
      setDetailedDescription('');
      setHasFragrance(false);
      setIsPopular(false);
      setSlug('');
      setRegions([]);
      setBloomSeasons([]);
      setColors([]);
      setUploadedImages([]);
    }
    setExpandedCategoryIds(new Set());
  }, [editOrchidData, isOpen, categories]);

  const categoryTree = useMemo(() => {
    const childrenByParent = new Map<string | null, Category[]>();
    categories.forEach((category) => {
      const parentKey = category.parentId ?? null;
      childrenByParent.set(parentKey, [...(childrenByParent.get(parentKey) ?? []), category]);
    });
    const catalogRoot = categories.find((category) => !category.parentId && category.name.toLocaleLowerCase('vi') === 'danh mục lan');
    return {
      childrenByParent,
      roots: catalogRoot ? childrenByParent.get(catalogRoot.id) ?? [] : childrenByParent.get(null) ?? [],
    };
  }, [categories]);

  const renderCategoryNode = (category: Category, depth = 0): React.ReactNode => {
    const children = categoryTree.childrenByParent.get(category.id) ?? [];
    const hasChildren = children.length > 0;
    const expanded = expandedCategoryIds.has(category.id);
    const selected = categoryIds.includes(category.id);

    if (hasChildren) {
      return (
        <div key={category.id}>
          <button
            type="button"
            onClick={() => setExpandedCategoryIds((current) => {
              const next = new Set(current);
              if (next.has(category.id)) next.delete(category.id);
              else next.add(category.id);
              return next;
            })}
            className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm font-semibold text-charcoal-text transition-colors hover:text-[#56642b]"
            style={{ paddingLeft: `${depth * 22}px` }}
            aria-expanded={expanded}
          >
            <span>{category.name}</span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          </button>
          {expanded && children.map((child) => renderCategoryNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <button
        key={category.id}
        type="button"
        onClick={() => setCategoryIds((current) => selected
          ? current.filter((id) => id !== category.id)
          : [...current, category.id])}
        className={`flex w-full items-center justify-between gap-3 py-2.5 pr-0.5 text-left text-sm transition-colors ${selected ? 'font-bold text-[#56642b]' : 'font-normal text-[#5f6461] hover:text-[#56642b]'}`}
        style={{ paddingLeft: `${depth * 22}px` }}
        aria-pressed={selected}
      >
        <span>{category.name}</span>
        {selected && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
      </button>
    );
  };

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
      regions: regions as (keyof typeof Region)[],
      bloomSeasons: bloomSeasons as (keyof typeof BloomSeason)[],
      colors: colors as (keyof typeof FlowerColor)[],
      uploadedImageIds: uploadedImages.map((image) => image.id),
      imageUrls: uploadedImages.map((image) => image.url).filter(Boolean),
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
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setErrorMsg('Mỗi ảnh phải có dung lượng không quá 10 MB.');
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
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
      >
        <div className="z-20 flex shrink-0 items-center justify-between border-b border-outline-variant bg-white px-5 py-2.5 md:px-6">
          <div className="flex items-center gap-2 text-[#56642b]">
            <PlusCircle className="h-4 w-4" />
            <h3 className="font-serif text-base font-bold text-on-surface md:text-lg">
              {isEditing ? 'Cập Nhật Loài Lan' : 'Thêm Loài Lan Mới'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 md:p-5">
          {errorMsg && (
            <div className="p-3 bg-error-container/20 border border-error/20 text-error text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[1.05fr_1.2fr]">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3f433f]">Danh mục loài lan *</h4>
              {categoryTree.roots.length > 0 ? (
                <div>
                  <button type="button" onClick={() => setCategoryIds([])} className={`flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm transition-colors ${categoryIds.length === 0 ? 'font-bold text-[#56642b]' : 'font-medium text-[#434748] hover:text-[#56642b]'}`} aria-pressed={categoryIds.length === 0}>
                    <span>Tất cả dòng lan</span>
                    {categoryIds.length === 0 && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                  </button>
                  <div className="ml-2 border-l border-[#d9dcd5] pl-3">
                    {categoryTree.roots.map((category) => renderCategoryNode(category))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-outline">Chưa có danh mục. Hãy tạo danh mục trước.</p>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setHasFragrance((value) => !value)}
                  className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${hasFragrance ? 'border-[#87905f]/50 bg-[#fafbf5]' : 'border-outline-variant bg-white hover:border-[#87905f]/40'}`}
                  aria-pressed={hasFragrance}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f4e9] text-[#667234]"><Leaf className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm text-charcoal-text">Có hương thơm</strong><span className="mt-0.5 block text-[11px] leading-4 text-outline">Loài lan có hương thơm đặc trưng</span></span>
                  <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${hasFragrance ? 'bg-[#667234]' : 'bg-[#d7d9d2]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hasFragrance ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPopular((value) => !value)}
                  className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${isPopular ? 'border-[#87905f]/50 bg-[#fafbf5]' : 'border-outline-variant bg-white hover:border-[#87905f]/40'}`}
                  aria-pressed={isPopular}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f4e9] text-[#667234]"><Star className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm text-charcoal-text">Phổ biến</strong><span className="mt-0.5 block text-[11px] leading-4 text-outline">Loài lan được trồng phổ biến</span></span>
                  <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isPopular ? 'bg-[#667234]' : 'bg-[#d7d9d2]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPopular ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#3f433f]">Khu vực phân bố</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(Region).map(([key, value]) => {
                    const selected = regions.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRegions((current) => selected ? current.filter((item) => item !== key) : [...current, key])}
                        className={`flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#87905f]/60 bg-[#f2f4e9] text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]/50'}`}
                        aria-pressed={selected}
                      >
                        {selected && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#667234] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-outline-variant pt-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3f433f]">Mùa hoa nở</h4>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                {Object.entries(BloomSeason).map(([key, value]) => {
                  const selected = bloomSeasons.includes(key);
                  const SeasonIcon = bloomSeasonIcons[key] ?? Flower2;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBloomSeasons((current) => selected ? current.filter((item) => item !== key) : [...current, key])}
                      className={`relative flex min-h-9 items-center justify-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#fafbf5] font-semibold text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]/50'}`}
                      aria-pressed={selected}
                    >
                      <SeasonIcon className="h-4 w-4 text-[#667234]" />
                      <span>{value}</span>
                      {selected && <span className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#667234] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3f433f]">Màu sắc hoa</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Object.entries(FlowerColor).map(([key, value]) => {
                  const selected = colors.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColors((current) => selected ? current.filter((item) => item !== key) : [...current, key])}
                      className={`relative flex min-h-9 items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#667234] bg-[#fafbf5] text-[#56642b]' : 'border-outline-variant bg-white text-charcoal-text hover:border-[#87905f]/50'}`}
                      aria-pressed={selected}
                    >
                      <span className="h-4 w-4 shrink-0 rounded-full border border-black/15 shadow-sm" style={{ backgroundColor: value }} />
                      <span>{flowerColorLabels[key] ?? key}</span>
                      {selected && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#667234] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-outline-variant pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3f433f]">Thông tin loài lan</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên thường gọi *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Hoàng Thảo Kèn" className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm focus:border-[#56642b] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên tiếng Anh / Danh pháp khoa học *</label>
                <input type="text" value={englishName} onChange={(e) => setEnglishName(e.target.value)} placeholder="Dendrobium nobile Lindl." className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm italic focus:border-[#56642b] focus:outline-none" />
              </div>
            </div>
          </section>

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
            <LocalRichTextEditor
              value={detailedDescription}
              onChange={setDetailedDescription}
              minHeight={180}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Hình ảnh hoa lan</label>
            <div className={`flex min-h-20 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant p-3 text-sm transition-colors ${
              isUploadingImages ? 'opacity-60 cursor-wait' : 'hover:border-[#56642b] hover:bg-[#f7f8f2]'
            }`}>
              <Upload className="w-5 h-5 text-[#56642b]" />
              <button
                type="button"
                disabled={isUploadingImages || isSubmitting}
                onClick={() => imageFileInputRef.current?.click()}
                className="min-w-48 px-4 py-2 rounded bg-[#56642b] text-white font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadingImages ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính'}
              </button>
              <span className="text-[10px] text-outline">Có thể chọn nhiều ảnh JPG, PNG, WEBP (tối đa 10 MB/ảnh)</span>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={isUploadingImages || isSubmitting}
                onChange={(event) => void handleUploadImages(event)}
                className="hidden"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {errorMsg}
              </p>
            )}

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

          </div>

          <div className="z-20 flex shrink-0 justify-end gap-2.5 border-t border-outline-variant bg-white px-5 py-2.5 md:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingImages}
              className="min-w-16 rounded-md px-3 py-1.5 text-xs font-semibold text-charcoal-text transition-colors hover:bg-outline-variant/30"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImages}
              className="min-w-28 rounded-md bg-[#56642b] px-5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#4a5624] disabled:cursor-not-allowed disabled:opacity-60"
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
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-sm w-full overflow-visible"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Danh mục cha (không bắt buộc)</label>
            <CategoryTreeSelect
              categories={categories}
              value={parentId}
              onChange={setParentId}
              excludeId={editCategoryData?.id}
              allLabel="Cấp gốc (không có danh mục cha)"
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
