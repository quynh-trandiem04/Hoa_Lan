import { useEffect, useState } from 'react';
import { LoaderCircle, Upload, X } from 'lucide-react';
import type { ArticleCategory, CareArticle } from '../types';
import {
  createSectionArticle,
  getUploadedImageUrl,
  updateSectionArticle,
  uploadImage,
  type ArticleSection,
} from '../services/api';
import LocalRichTextEditor from './LocalRichTextEditor';

interface PublicArticleAdminModalProps {
  section: ArticleSection;
  article: CareArticle | null;
  categories: ArticleCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const slugify = (value: string) => value
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export default function PublicArticleAdminModal({
  section,
  article,
  categories,
  isOpen,
  onClose,
  onSaved,
}: PublicArticleAdminModalProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailImageId, setThumbnailImageId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(article?.title ?? '');
    setSlug(article?.slug ?? '');
    setSummary(article?.summary ?? '');
    setContent(article?.content ?? '');
    setThumbnailImageId(article?.thumbnailImageId ?? '');
    setCategoryId(article?.articleCategoryIds?.[0] ?? article?.categories?.[0]?.id ?? article?.categoryId ?? '');
    setIsPublished(article?.isPublished ?? true);
    setError('');
  }, [article, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung bài viết.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      summary: summary.trim(),
      content: content.trim(),
      thumbnailImageId: thumbnailImageId.trim() || null,
      isPublished,
      articleCategoryIds: categoryId ? [categoryId] : [],
      orchidIds: article?.orchidIds ?? [],
      documentIds: article?.documentIds ?? [],
    };
    try {
      if (article?.id) await updateSectionArticle(section, article.id, payload);
      else await createSectionArticle(section, payload);
      onSaved(article?.id ? 'Đã cập nhật bài viết.' : 'Đã tạo bài viết mới.');
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu bài viết.');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError('Ảnh phải đúng định dạng và không vượt quá 10 MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadImage(file);
      setThumbnailImageId(uploaded.id);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={article ? 'Chỉnh sửa bài viết' : 'Thêm bài viết'}>
      <form onSubmit={handleSubmit} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dedfd9] bg-white px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71803c]">Quản trị nhanh</p>
            <h2 className="font-serif text-2xl font-bold">{article ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#747878] hover:bg-[#f0f1ec]" aria-label="Đóng"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Tiêu đề *</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Slug</span>
              <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Tự tạo từ tiêu đề" className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Danh mục</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] bg-white px-4 py-3 text-sm outline-none focus:border-[#56642b]">
                <option value="">Không chọn danh mục</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Tóm tắt</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Nội dung *</span>
            <LocalRichTextEditor value={content} onChange={setContent} minHeight={260} />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">ID ảnh đại diện</span>
              <input value={thumbnailImageId} onChange={(event) => setThumbnailImageId(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" />
            </label>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[#56642b] px-4 py-3 text-xs font-bold uppercase text-[#56642b] hover:bg-[#eef1e2]">
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Đang tải...' : 'Tải ảnh'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => void handleThumbnail(event)} />
            </label>
          </div>
          {thumbnailImageId && <img src={getUploadedImageUrl(thumbnailImageId)} alt="Ảnh đại diện" className="max-h-44 rounded-lg border border-[#dedfd9] object-contain" />}
          <label className="inline-flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="h-4 w-4 accent-[#56642b]" />
            Xuất bản bài viết
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#dedfd9] bg-[#fafaf7] px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-[#cfd2cb] bg-white px-4 py-2.5 text-xs font-bold uppercase">Hủy</button>
          <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-md bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">
            {saving && <LoaderCircle size={15} className="animate-spin" />}{saving ? 'Đang lưu...' : 'Lưu bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}
