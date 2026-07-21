import { useMemo, useState } from 'react';
import { Edit, FolderPlus, Layers, Plus, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ArticleCategory } from '../types';
import {
  createArticleCategory,
  deleteArticleCategory,
  getArticleCategoryById,
  updateArticleCategory,
  type ArticleSection,
} from '../services/api';

interface ArticleCategoryManagerProps {
  section: ArticleSection;
  title: string;
  categories: ArticleCategory[];
  loading: boolean;
  onReload: () => Promise<void>;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
}

const slugify = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export default function ArticleCategoryManager({
  section,
  title,
  categories,
  loading,
  onReload,
  notify,
}: ArticleCategoryManagerProps) {
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  const orderedCategories = useMemo(() => {
    const result: Array<ArticleCategory & { depth: number }> = [];
    const visited = new Set<string>();
    const append = (currentParentId: string | null, depth: number) => {
      categories
        .filter((category) => (category.parentId ?? null) === currentParentId)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        .forEach((category) => {
          if (visited.has(category.id)) return;
          visited.add(category.id);
          result.push({ ...category, depth });
          append(category.id, depth + 1);
        });
    };
    append(null, 0);
    categories.filter((category) => !visited.has(category.id)).forEach((category) => result.push({ ...category, depth: 0 }));
    return result;
  }, [categories]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setDescription('');
    setParentId('');
  };

  const openCreate = () => {
    closeForm();
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    try {
      const category = await getArticleCategoryById(section, id);
      setEditing(category);
      setName(category.name);
      setDescription(category.description);
      setParentId(category.parentId ?? '');
      setShowForm(true);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể tải thông tin danh mục.', 'error');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify('Vui lòng nhập tên danh mục.', 'error');
      return;
    }
    const duplicate = categories.find((category) => category.id !== editing?.id
      && category.name.trim().toLocaleLowerCase('vi') === trimmedName.toLocaleLowerCase('vi'));
    if (duplicate) {
      notify(`Danh mục “${duplicate.name}” đã tồn tại.`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        slug: editing?.slug || slugify(trimmedName),
        parentId: parentId || null,
      };
      if (editing) {
        await updateArticleCategory(section, editing.id, payload);
        notify(`Đã cập nhật danh mục: ${trimmedName}`, 'success');
      } else {
        await createArticleCategory(section, payload);
        notify(`Đã tạo danh mục: ${trimmedName}`, 'success');
      }
      closeForm();
      await onReload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể lưu danh mục.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: ArticleCategory) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục “${category.name}”?`)) return;
    try {
      await deleteArticleCategory(section, category.id);
      notify(`Đã xóa danh mục: ${category.name}`, 'success');
      await onReload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể xóa danh mục.', 'error');
    }
  };

  const renderCategoryTree = (currentParentId: string | null, level = 0): React.ReactNode => {
    const children = categories
      .filter((category) => (category.parentId ?? null) === currentParentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (children.length === 0) return null;

    const leaves = children.filter((category) => !categories.some((child) => child.parentId === category.id));
    const nodes = children.filter((category) => categories.some((child) => child.parentId === category.id));

    return (
      <div className={`space-y-8 ${level > 0 ? 'mt-6 ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-botanical-green/20' : ''}`}>
        {leaves.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaves.map((category) => (
              <div key={category.id} className="bg-white p-5 border border-outline-variant/40 rounded-xl relative overflow-hidden group hover:border-[#56642b]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[10px] tracking-widest font-mono text-outline uppercase">Danh mục chi</span>
                    {typeof category.articleCount === 'number' && category.articleCount > 0 && (
                      <span className="text-xs font-bold font-mono text-[#5a682f] bg-[#d6e7a0]/30 px-2 py-0.5 rounded whitespace-nowrap">
                        {category.articleCount} bài viết
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-bold text-charcoal-text mt-3">{category.name}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-2.5">
                    {category.description || 'Chưa có mô tả chi tiết cho danh mục này.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#f4f4f2] mt-4 flex justify-between items-center gap-2">
                  <span className="text-[9px] text-[#735c00] font-mono truncate" title={category.slug}>/{category.slug}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => void openEdit(category.id)} className="p-1.5 text-outline hover:text-botanical-green hover:bg-surface-container rounded transition-colors" title="Chỉnh sửa danh mục" aria-label={`Chỉnh sửa ${category.name}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => void remove(category)} className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded transition-colors" title="Xóa danh mục" aria-label={`Xóa ${category.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {nodes.map((category) => {
          const childCount = categories.filter((child) => child.parentId === category.id).length;
          return (
            <div key={category.id} className={level === 0 ? 'bg-surface-cream rounded-2xl p-6 border border-outline-variant/30' : 'mt-8'}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-outline-variant/20 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className={`font-serif font-bold text-charcoal-text ${level === 0 ? 'text-2xl' : 'text-xl'}`}>{category.name}</h3>
                    <span className="text-[10px] font-bold font-mono text-[#5a682f] bg-[#d6e7a0]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                      {childCount} danh mục con
                    </span>
                  </div>
                  {category.description && <p className="text-sm text-on-surface-variant mt-1.5">{category.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => void openEdit(category.id)} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-outline hover:text-botanical-green hover:bg-surface-container rounded transition-colors flex items-center gap-1.5" title="Chỉnh sửa danh mục">
                    <Edit className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button type="button" onClick={() => void remove(category)} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-outline hover:text-error hover:bg-error-container/20 rounded transition-colors flex items-center gap-1.5" title="Xóa danh mục">
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
              {renderCategoryTree(category.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-on-surface">{title}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {section === 'cultivation'
              ? 'Tổ chức các chủ đề hướng dẫn trồng, chăm sóc và bảo tồn hoa lan.'
              : 'Tổ chức các lĩnh vực ứng dụng và nội dung liên quan đến hoa lan.'}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-botanical-green text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:shadow">
          <Plus className="w-4 h-4" /> Tạo danh mục mới
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2 text-botanical-green">
                <FolderPlus className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-on-surface">{editing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục'}</h3>
              </div>
              <button type="button" onClick={closeForm} disabled={saving} className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <label className="space-y-1 block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Tên danh mục</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nhập tên danh mục..." className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green" />
              </label>
              <label className="space-y-1 block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Danh mục cha</span>
                <select value={parentId} onChange={(event) => setParentId(event.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green">
                  <option value="">Không có — danh mục cấp gốc</option>
                  {orderedCategories.filter((category) => category.id !== editing?.id).map((category) => (
                    <option key={category.id} value={category.id}>{'— '.repeat(category.depth)}{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-outline font-sans">Mô tả</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Nhập mô tả cho danh mục..." className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-botanical-green resize-none text-charcoal-text" />
              </label>
              <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button type="button" onClick={closeForm} disabled={saving} className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all">Hủy bỏ</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-botanical-green text-on-secondary font-medium text-xs uppercase hover:opacity-90 disabled:opacity-60 transition-all rounded">
                  {saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Tạo danh mục')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="space-y-4">
        {loading && <p className="py-8 text-center text-sm text-on-surface-variant">Đang tải danh mục từ máy chủ...</p>}
        {!loading && categories.length === 0 ? (
          <div className="py-14 text-center text-sm text-outline">
            <Layers className="w-10 h-10 mx-auto mb-3 text-botanical-green/30" />
            Chưa có danh mục nào.
          </div>
        ) : !loading ? renderCategoryTree(null) : null}
      </div>
    </div>
  );
}
