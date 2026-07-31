import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Edit, FileText, FolderPlus, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { DocumentCategory } from '../types';
import CategoryTreeSelect from './CategoryTreeSelect';
import AdminPagination from './AdminPagination';

export interface DocumentCategoryValues {
  name: string;
  description: string;
  parentId: string | null;
  slug?: string;
}

interface DocumentCategoryManagerProps {
  categories: DocumentCategory[];
  loading: boolean;
  onCreate: (values: DocumentCategoryValues) => Promise<void>;
  onUpdate: (id: string, values: DocumentCategoryValues) => Promise<void>;
  onDelete: (category: DocumentCategory) => Promise<void>;
}

export default function DocumentCategoryManager({
  categories,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: DocumentCategoryManagerProps) {
  const pageSize = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<DocumentCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, DocumentCategory[]>();
    categories.forEach((category) => {
      const key = category.parentId ?? null;
      result.set(key, [...(result.get(key) ?? []), category]);
    });
    result.forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    return result;
  }, [categories]);
  const rootCategories = childrenByParent.get(null) ?? [];
  const pagedRootCategories = useMemo(
    () => rootCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, rootCategories],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(rootCategories.length / pageSize))));
  }, [rootCategories.length]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setParentId('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (category: DocumentCategory) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description);
    setParentId(category.parentId ?? '');
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setError('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên danh mục tài liệu.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const values: DocumentCategoryValues = {
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || null,
        slug: editing?.slug,
      };
      if (editing) await onUpdate(editing.id, values);
      else await onCreate(values);
      closeForm();
      setShowForm(false);
      setEditing(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu danh mục tài liệu.');
    } finally {
      setSaving(false);
    }
  };

  const renderTree = (currentParentId: string | null, depth = 0): React.ReactNode => {
    const children = currentParentId === null
      ? pagedRootCategories
      : childrenByParent.get(currentParentId) ?? [];
    if (children.length === 0) return null;

    return (
      <div className={depth > 0 ? 'ml-4 border-l-2 border-[#d6e7a1] pl-4 sm:ml-8 sm:pl-6' : ''}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children.map((category) => {
            const childCount = (childrenByParent.get(category.id) ?? []).length;
            return (
              <div key={category.id} className="rounded-xl border border-outline-variant/40 bg-white p-5 transition-all hover:border-[#56642b]/50 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rounded-lg bg-[#eef1e2] p-2 text-[#56642b]">
                      {childCount > 0 ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        {childCount > 0 ? `${childCount} danh mục con` : 'Danh mục tài liệu'}
                      </p>
                      <h3 className="mt-1 font-serif text-lg font-bold text-charcoal-text">{category.name}</h3>
                    </div>
                  </div>
                  <span className="rounded bg-[#f4f4f2] px-2 py-0.5 font-mono text-[10px] font-bold text-outline">
                    {category.documentCount ?? 0}
                  </span>
                </div>
                <p className="mt-3 min-h-10 text-xs leading-relaxed text-on-surface-variant">
                  {category.description || 'Chưa có mô tả cho danh mục này.'}
                </p>
                <div className="mt-4 flex justify-end gap-1 border-t border-[#f4f4f2] pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="rounded p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-[#56642b]"
                    title="Sửa danh mục"
                    aria-label={`Sửa ${category.name}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(category)}
                    className="rounded p-1.5 text-outline transition-colors hover:bg-error-container/20 hover:text-error"
                    title="Xóa danh mục"
                    aria-label={`Xóa ${category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {children.map((category) => {
          const descendants = childrenByParent.get(category.id) ?? [];
          return descendants.length > 0
            ? <div key={`${category.id}-children`} className="mt-5">{renderTree(category.id, depth + 1)}</div>
            : null;
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-on-surface">Quản lý danh mục tài liệu</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tổ chức thư viện tài liệu theo danh mục nhiều cấp.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-botanical-green px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:shadow"
        >
          <FolderPlus className="h-4 w-4" /> Tạo danh mục mới
        </button>
      </div>

      {loading && <p className="py-10 text-center text-sm text-outline">Đang tải danh mục tài liệu...</p>}
      {!loading && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-variant bg-white py-14 text-center text-sm text-outline">
          Chưa có danh mục tài liệu nào.
        </div>
      )}
      {!loading && categories.length > 0 && renderTree(null)}
      {!loading && (
        <AdminPagination
          currentPage={currentPage}
          totalItems={rootCategories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="nhóm danh mục"
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-text/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm overflow-visible rounded-xl border border-outline-variant bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div className="flex items-center gap-2 text-botanical-green">
                <FolderPlus className="h-5 w-5" />
                <h3 className="font-serif text-lg font-bold text-on-surface">
                  {editing ? 'Chỉnh sửa danh mục tài liệu' : 'Thêm danh mục tài liệu'}
                </h3>
              </div>
              <button type="button" onClick={closeForm} className="rounded-full p-1 text-outline hover:bg-surface-container hover:text-charcoal-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4 p-6">
              {error && <div className="rounded border border-error/20 bg-error-container/20 p-2 text-xs text-error">{error}</div>}
              <label className="block space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">Tên danh mục *</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Kỹ thuật chăm sóc"
                  className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm focus:border-botanical-green focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">Danh mục cha (không bắt buộc)</span>
                <CategoryTreeSelect
                  categories={categories}
                  value={parentId}
                  onChange={setParentId}
                  excludeId={editing?.id}
                  allLabel="Cấp gốc (không có danh mục cha)"
                />
              </label>
              <label className="block space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">Mô tả</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Mô tả ngắn về nhóm tài liệu..."
                  className="w-full resize-none rounded border border-outline-variant bg-surface-container-low p-3 text-sm focus:border-botanical-green focus:outline-none"
                />
              </label>
              <div className="-mx-6 -mb-6 mt-4 flex justify-end gap-2 border-t border-outline-variant bg-surface-container-low p-4">
                <button type="button" onClick={closeForm} disabled={saving} className="border border-outline px-4 py-2 text-xs font-medium uppercase text-on-surface-variant">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={saving} className="rounded bg-botanical-green px-5 py-2 text-xs font-medium uppercase text-white disabled:opacity-60">
                  {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
