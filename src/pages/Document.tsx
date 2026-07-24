import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, HardDrive, LoaderCircle, Search, X } from 'lucide-react';
import type { DocumentCategory, DocumentItem } from '../types';
import { getDocumentCategories, getDocuments } from '../services/api';
import InlineTreeMultiSelect from '../components/InlineTreeMultiSelect';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import PageIntro from '../components/PageIntro';

const PAGE_SIZE = 6;

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

export default function DocumentPage() {
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

  useEffect(() => {
    let active = true;
    setLoadingCategories(true);
    void getDocumentCategories({ pageNumber: 1, pageSize: 100, sortBy: 'name', sortDescending: false })
      .then((result) => {
        if (active) setCategories(result.items ?? []);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });
    return () => { active = false; };
  }, []);

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
  }, [categories, selectedCategoryIds, debouncedSearchTerm]);

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

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 font-sans animate-fade-in md:px-16">
        <div className="mb-8 flex items-center space-x-2 text-xs font-medium tracking-wider text-[#747878]">
          <a href="/" className="transition-colors hover:text-[#56642b]">← Trang chủ</a>
          <span>&gt;</span>
          <span className="font-semibold text-[#1a1c1b]">Tài liệu</span>
        </div>

        <PageIntro
          eyebrow="Kho tư liệu chuyên sâu về hoa lan"
          title="Thư Viện Tài Liệu Hoa Lan"
          description="Nơi lưu trữ các nghiên cứu khoa học, sách chuyên khảo và tài liệu kỹ thuật về các loài lan, cung cấp nền tảng kiến thức chuyên sâu cho giới học thuật và người yêu lan."
        />

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
              <div className="grid grid-cols-1 gap-6">
                {paginatedDocuments.map((document) => {
                  const downloadKey = document.id ?? document.url;
                  return (
                    <article key={downloadKey} className="group overflow-hidden rounded-md border border-[#747878]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex sm:min-h-36">
                      <div className="flex h-32 w-full shrink-0 flex-col items-center justify-center bg-[#f0f1ec] text-[#667234] sm:h-auto sm:w-36">
                        <FileText size={28} />
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">{document.extension || 'FILE'}</span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#56642b]">
                          {document.categoryName || 'Tài liệu'}
                        </span>
                        <h2 className="mt-1 line-clamp-1 font-serif text-lg font-bold leading-snug transition-colors group-hover:text-[#56642b]">
                          {document.title}
                        </h2>
                        <p className="mt-1 line-clamp-1 text-xs leading-4 text-[#686d6a]">
                          {document.description || 'Chưa có mô tả cho tài liệu này.'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#747878]">
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(document.createdAt)}</span>
                          <span className="flex items-center gap-1.5"><HardDrive size={12} /> {formatFileSize(document.sizeBytes)}</span>
                        </div>
                        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => void handleDownload(document)}
                            disabled={downloadingId === downloadKey}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#735c00] hover:underline disabled:cursor-wait disabled:opacity-60"
                          >
                            <Download size={13} />
                            {downloadingId === downloadKey ? 'Đang tải...' : 'Tải xuống'}
                          </button>
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#56642b] hover:underline"
                          >
                            <Eye size={13} /> Xem trước
                          </a>
                        </div>
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
    </div>
  );
}
