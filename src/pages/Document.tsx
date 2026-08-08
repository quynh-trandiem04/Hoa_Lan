import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, Edit, Eye, FileText, FolderTree, HardDrive, LoaderCircle, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import type { DocumentCategory, DocumentItem } from '../types';
import { createDocument, createDocumentCategory, deleteDocument, deleteDocumentCategory, getDocumentCategories, getDocuments, updateDocument, updateDocumentCategory } from '../services/api';
import InlineTreeMultiSelect from '../components/InlineTreeMultiSelect';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import PageIntro from '../components/PageIntro';
import { useConfirmDialog } from '../components/ConfirmDialog';
import DocumentCategoryManager, { type DocumentCategoryValues } from '../components/DocumentCategoryManager';

const PAGE_SIZE = 6;

const slugify = (value: string) => value
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const formatFileSize = (bytes: number) => {
  if (!bytes) return 'Không rõ';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Không rõ';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không rõ' : date.toLocaleDateString('vi-VN');
};

interface DocumentPageProps {
  isAdmin?: boolean;
}

export default function DocumentPage({ isAdmin = false }: DocumentPageProps) {
  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog();
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => initialParams.get('q') ?? '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() => initialParams.get('q') ?? '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    (initialParams.get('cat') ?? '').split(',').filter(Boolean)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [adminEditorOpen, setAdminEditorOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminDescription, setAdminDescription] = useState('');
  const [adminCategoryId, setAdminCategoryId] = useState('');
  const [adminFile, setAdminFile] = useState<File | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminRevision, setAdminRevision] = useState(0);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const categoryOptions = useMemo(() => {
    const childrenByParent = new Map<string | null, DocumentCategory[]>();
    const categoryIds = new Set(categories.map((category) => category.id));
    categories.forEach((category) => {
      const parentId = category.parentId && categoryIds.has(category.parentId) ? category.parentId : null;
      childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), category]);
    });
    childrenByParent.forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name, 'vi')));

    const result: Array<DocumentCategory & { depth: number }> = [];
    const append = (parentId: string | null, depth: number) => {
      (childrenByParent.get(parentId) ?? []).forEach((category) => {
        result.push({ ...category, depth });
        append(category.id, depth + 1);
      });
    };
    append(null, 0);
    return result;
  }, [categories]);

  const loadDocumentCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const result = await getDocumentCategories({ pageNumber: 1, pageSize: 100, sortBy: 'name', sortDescending: false });
      setCategories(result.items ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadDocumentCategories();
  }, [loadDocumentCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const requestedCategoryIds = new Set(selectedCategoryIds);
    let foundDescendant = true;
    while (foundDescendant) {
      foundDescendant = false;
      categories.forEach((category) => {
        if (category.parentId && requestedCategoryIds.has(category.parentId) && !requestedCategoryIds.has(category.id)) {
          requestedCategoryIds.add(category.id);
          foundDescendant = true;
        }
      });
    }

    const categoryRequests = requestedCategoryIds.size > 0 ? [...requestedCategoryIds] : [undefined];
    void Promise.all(categoryRequests.map((categoryId) =>
      getDocuments(1, 100, debouncedSearchTerm || undefined, undefined, categoryId)
    ))
      .then((results) => {
        if (!active) return;
        const uniqueDocuments = new Map<string, DocumentItem>();
        results.flatMap((result) => result.items ?? []).forEach((document) => {
          uniqueDocuments.set(document.id ?? document.url, document);
        });
        setDocuments([...uniqueDocuments.values()]);
      })
      .catch((loadError) => {
        if (!active) return;
        setDocuments([]);
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách tài liệu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [categories, selectedCategoryIds, debouncedSearchTerm, adminRevision]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedCategoryIds.length > 0) params.set('cat', selectedCategoryIds.join(','));
    window.history.replaceState(null, '', `/document${params.size ? `?${params.toString()}` : ''}`);
  }, [searchTerm, selectedCategoryIds]);

  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE));
  const paginatedDocuments = documents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategoryIds([]);
    setCurrentPage(1);
    window.history.replaceState(null, '', '/document');
  };

  const handleDownload = async (document: DocumentItem) => {
    if (!document.url || downloadingId) return;
    setDownloadingId(document.id ?? document.url);
    try {
      const response = await fetch(document.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = document.originalName || `${document.title}.${document.extension || 'file'}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error('Không thể tải tài liệu:', downloadError);
      window.alert('Không thể tải tài liệu xuống. Vui lòng thử lại.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openAdminEditor = (document?: DocumentItem) => {
    setEditingDocument(document ?? null);
    setAdminTitle(document?.title ?? '');
    setAdminDescription(document?.description ?? '');
    setAdminCategoryId(document?.categoryId ?? '');
    setAdminFile(null);
    setError('');
    setAdminEditorOpen(true);
  };

  const handleAdminSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminTitle.trim() || (!editingDocument && !adminFile)) {
      setError(editingDocument ? 'Vui lòng nhập tiêu đề tài liệu.' : 'Vui lòng nhập tiêu đề và chọn tệp.');
      return;
    }
    if (adminFile && adminFile.size > 50 * 1024 * 1024) {
      setError('Tệp tài liệu không được vượt quá 50 MB.');
      return;
    }
    setAdminSaving(true);
    setError('');
    try {
      if (editingDocument?.id) {
        await updateDocument(editingDocument.id, {
          title: adminTitle.trim(),
          description: adminDescription.trim(),
          categoryId: adminCategoryId || null,
        });
        setAdminMessage('Đã cập nhật tài liệu.');
      } else {
        await createDocument({
          file: adminFile!,
          title: adminTitle.trim(),
          description: adminDescription.trim(),
          categoryId: adminCategoryId || null,
        });
        setAdminMessage('Đã tải tài liệu mới lên.');
      }
      setAdminEditorOpen(false);
      setEditingDocument(null);
      setAdminFile(null);
      setAdminRevision((revision) => revision + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu tài liệu.');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleAdminDelete = async (document: DocumentItem) => {
    if (!document.id || !(await confirmDelete({
      title: 'Xóa tài liệu?',
      message: 'Tài liệu và tệp đính kèm sẽ bị gỡ khỏi thư viện.',
      itemName: document.title,
      confirmLabel: 'Xóa tài liệu',
    }))) return;
    try {
      await deleteDocument(document.id);
      setAdminMessage('Đã xóa tài liệu.');
      setAdminRevision((revision) => revision + 1);
    } catch (deleteError) {
      setAdminMessage(deleteError instanceof Error ? deleteError.message : 'Không thể xóa tài liệu.');
    }
  };

  const handleCreateDocumentCategory = async (values: DocumentCategoryValues) => {
    await createDocumentCategory({
      name: values.name.trim(),
      description: values.description.trim(),
      slug: values.slug || slugify(values.name),
      parentId: values.parentId,
    });
    setAdminMessage(`Đã tạo danh mục: ${values.name}`);
    await loadDocumentCategories();
  };

  const handleUpdateDocumentCategory = async (id: string, values: DocumentCategoryValues) => {
    await updateDocumentCategory(id, {
      name: values.name.trim(),
      description: values.description.trim(),
      slug: values.slug || slugify(values.name),
      parentId: values.parentId,
    });
    setAdminMessage(`Đã cập nhật danh mục: ${values.name}`);
    await loadDocumentCategories();
  };

  const handleDeleteDocumentCategory = async (category: DocumentCategory) => {
    if (!(await confirmDelete({
      title: 'Xóa danh mục tài liệu?',
      message: 'Hãy chắc chắn danh mục không còn tài liệu hoặc danh mục con trước khi xóa.',
      itemName: category.name,
      confirmLabel: 'Xóa danh mục',
    }))) return;
    await deleteDocumentCategory(category.id);
    setAdminMessage(`Đã xóa danh mục: ${category.name}`);
    await loadDocumentCategories();
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 font-sans animate-fade-in md:px-16">
        <div className="mb-8 flex items-center space-x-2 text-xs font-medium tracking-wider text-[#747878]">
          <a href="/" className="flex items-center gap-1 transition-colors hover:text-botanical-green"><ArrowLeft size={14} /> Trang chủ</a>
          <span>&gt;</span>
          <span className="font-semibold text-[#1a1c1b]">Tài liệu</span>
        </div>

        <PageIntro
          eyebrow="Kho tư liệu chuyên sâu về hoa lan"
          title="Thư Viện Tài Liệu Hoa Lan"
          description="Nơi lưu trữ các nghiên cứu khoa học, sách chuyên khảo và tài liệu kỹ thuật về các loài lan, cung cấp nền tảng kiến thức chuyên sâu cho giới học thuật và người yêu lan."
        />

        {isAdmin && (
          <div className="mb-8 flex flex-col gap-3 rounded-xl border border-[#87905f]/35 bg-[#f1f4e7] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#667234]">Chế độ quản trị</p>
              <p className="mt-1 text-sm text-[#4f554e]">Thêm, sửa hoặc xóa tài liệu trực tiếp trong thư viện.</p>
              {adminMessage && <p className="mt-1 text-xs font-semibold text-[#56642b]">{adminMessage}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openAdminEditor()} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#56642b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#44501f]"><Plus size={16} /> Thêm tài liệu</button>
              <button type="button" onClick={() => setShowCategoryManager(true)} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#56642b] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#56642b] hover:bg-[#eef1e2]"><FolderTree size={16} /> Quản lý danh mục</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <aside className="space-y-8 lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747878]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full rounded border border-[#747878]/20 bg-white p-3 pl-9 text-xs outline-none focus:border-botanical-green"
              />
            </div>

            <div className="space-y-4">
              <h4 className="border-b border-[#747878]/10 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#1a1c1b]">
                Phân loại tài liệu
              </h4>
              <InlineTreeMultiSelect
                options={categoryOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                  depth: category.depth,
                }))}
                values={selectedCategoryIds}
                onChange={(categoryIds) => {
                  setSelectedCategoryIds(categoryIds);
                  setCurrentPage(1);
                }}
                allLabel="Tất cả danh mục"
                emptyMessage={loadingCategories ? 'Đang tải danh mục...' : 'Chưa có danh mục.'}
              />
            </div>

            {(searchTerm || selectedCategoryIds.length > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-md border border-dashed border-red-200 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-red-600 transition-all hover:border-red-500 hover:bg-red-50/50"
              >
                Xóa bộ lọc
              </button>
            )}
          </aside>

          <section className="min-w-0 space-y-12 lg:col-span-9">
            <div className="flex items-center justify-between border-b border-[#747878]/10 pb-3 text-xs text-[#747878]">
              <span>{loading ? 'Đang tải tài liệu...' : `Đang hiển thị ${documents.length} tài liệu`}</span>
              {(searchTerm || selectedCategoryIds.length > 0) && (
                <span className="rounded-[2px] bg-[#56642b]/10 px-2 py-0.5 text-[10px] font-semibold text-botanical-green">
                  ĐÃ LỌC
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-24 text-[#56642b]"><LoaderCircle className="animate-spin" /></div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm text-red-700">{error}</div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 rounded-md border border-[#747878]/10 bg-white py-24 text-center">
                <X size={32} className="text-[#747878]/30" />
                <p className="text-xs italic text-[#747878]">
                  Không tìm thấy tài liệu nào phù hợp với bộ lọc hiện tại.
                </p>
                <button type="button" onClick={clearFilters} className="mt-2 text-xs font-bold uppercase tracking-widest text-botanical-green hover:underline">
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {paginatedDocuments.map((document) => {
                  const downloadKey = document.id ?? document.url;
                  return (
                    <article
                      key={downloadKey}
                      className="group flex flex-col gap-3 rounded-xl border border-[#747878]/15 bg-white p-4 shadow-[0_3px_12px_rgba(42,49,32,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_20px_rgba(42,49,32,0.12)] sm:grid sm:min-h-40 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:grid-rows-[1fr_auto] sm:gap-x-5 sm:gap-y-2 sm:p-4"
                    >
                      <div className="flex h-24 w-full shrink-0 flex-col items-center justify-center rounded-xl bg-[#f0f1ec] text-[#667234] sm:row-span-2 sm:h-full sm:min-h-28">
                        <FileText size={30} strokeWidth={1.8} />
                        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider">{document.extension || 'FILE'}</span>
                      </div>

                      <div className="min-w-0 self-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#667234]">
                          {document.categoryName || 'Tài liệu'}
                        </span>
                        <h2 className="mt-1.5 line-clamp-1 font-serif text-lg font-bold leading-snug text-[#111412] transition-colors group-hover:text-[#56642b]">
                          {document.title}
                        </h2>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#686d6a]">
                          {document.description || 'Chưa có mô tả cho tài liệu này.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 self-center text-[11px] text-[#747878] sm:flex-nowrap sm:gap-4">
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={15} /> {formatDate(document.createdAt)}</span>
                        <span className="hidden h-5 w-px bg-[#747878]/20 sm:block" />
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><HardDrive size={15} /> {formatFileSize(document.sizeBytes)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 sm:col-start-2">
                        <button
                          type="button"
                          onClick={() => void handleDownload(document)}
                          disabled={downloadingId === downloadKey}
                          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#667234] hover:underline disabled:cursor-wait disabled:opacity-60"
                        >
                          <Download size={15} />
                          {downloadingId === downloadKey ? 'Đang tải...' : 'Tải xuống'}
                        </button>
                        <span className="h-5 w-px bg-[#747878]/20" />
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#667234] hover:underline"
                        >
                          <Eye size={15} /> Xem trước
                        </a>
                        {isAdmin && (
                          <>
                            <span className="h-5 w-px bg-[#747878]/20" />
                            <button type="button" onClick={() => openAdminEditor(document)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#56642b] hover:underline"><Edit size={15} /> Sửa</button>
                            <button type="button" onClick={() => void handleAdminDelete(document)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:underline"><Trash2 size={15} /> Xóa</button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  className={`flex items-center justify-center rounded-md border border-[#747878]/20 p-2 transition-all ${
                    currentPage === 1
                      ? 'cursor-not-allowed bg-transparent text-[#747878]/30'
                      : 'bg-white text-[#1a1c1b] hover:border-botanical-green hover:shadow-sm'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold tracking-wider transition-all ${
                      currentPage === page
                        ? 'border-botanical-green bg-botanical-green text-white shadow-sm'
                        : 'border-[#747878]/20 bg-white text-[#1a1c1b] hover:border-botanical-green'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  className={`flex items-center justify-center rounded-md border border-[#747878]/20 p-2 transition-all ${
                    currentPage === totalPages
                      ? 'cursor-not-allowed bg-transparent text-[#747878]/30'
                      : 'bg-white text-[#1a1c1b] hover:border-botanical-green hover:shadow-sm'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <PublicFooter />

      {isAdmin && adminEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={editingDocument ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu'}>
          <form onSubmit={handleAdminSave} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dedfd9] px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71803c]">Quản trị nhanh</p>
                <h2 className="font-serif text-2xl font-bold">{editingDocument ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}</h2>
              </div>
              <button type="button" onClick={() => setAdminEditorOpen(false)} className="rounded-full p-2 text-[#747878] hover:bg-[#f0f1ec]" aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="space-y-4 p-6">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Tiêu đề *</span><input value={adminTitle} onChange={(event) => setAdminTitle(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Mô tả</span><textarea value={adminDescription} onChange={(event) => setAdminDescription(event.target.value)} rows={4} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Danh mục</span><select value={adminCategoryId} onChange={(event) => setAdminCategoryId(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] bg-white px-4 py-3 text-sm outline-none"><option value="">Không chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              {editingDocument ? (
                <div className="rounded-lg border border-[#dedfd9] bg-[#fafaf7] px-4 py-3 text-sm"><strong>Tệp hiện tại:</strong> {editingDocument.originalName}</div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#87905f] bg-[#f7f8f1] px-5 py-8 text-sm font-semibold text-[#56642b] hover:bg-[#eef1e2]"><Upload size={20} />{adminFile?.name ?? 'Chọn tệp tài liệu (tối đa 50 MB)'}<input type="file" className="hidden" onChange={(event) => setAdminFile(event.target.files?.[0] ?? null)} /></label>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dedfd9] bg-[#fafaf7] px-6 py-4"><button type="button" onClick={() => setAdminEditorOpen(false)} disabled={adminSaving} className="rounded-md border border-[#cfd2cb] bg-white px-4 py-2.5 text-xs font-bold uppercase">Hủy</button><button type="submit" disabled={adminSaving} className="inline-flex items-center gap-2 rounded-md bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">{adminSaving && <LoaderCircle size={15} className="animate-spin" />}{adminSaving ? 'Đang lưu...' : 'Lưu tài liệu'}</button></div>
          </form>
        </div>
      )}
      {isAdmin && showCategoryManager && (
        <div className="fixed inset-0 z-[90] bg-[#111412]/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Quản lý danh mục tài liệu">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f9f9f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dedfd9] bg-white px-6 py-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71803c]">Quản trị nhanh</p><h2 className="font-serif text-2xl font-bold">Danh mục tài liệu</h2></div>
              <button type="button" onClick={() => setShowCategoryManager(false)} className="rounded-full p-2 text-[#747878] hover:bg-[#f0f1ec]" aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-7">
              <DocumentCategoryManager
                categories={categories}
                loading={loadingCategories}
                onCreate={handleCreateDocumentCategory}
                onUpdate={handleUpdateDocumentCategory}
                onDelete={handleDeleteDocumentCategory}
              />
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
