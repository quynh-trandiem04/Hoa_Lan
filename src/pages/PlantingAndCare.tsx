import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Edit, FileText, FolderTree, LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react';
import type { ArticleCategory, CareArticle } from '../types';
import { deleteSectionArticle, getArticleById, getArticleCategories, getSectionArticles, getUploadedImageUrl, type ArticleSection } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import InlineTreeMultiSelect from '../components/InlineTreeMultiSelect';
import PageIntro from '../components/PageIntro';
import PublicArticleAdminModal from '../components/PublicArticleAdminModal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import ArticleCategoryManager from '../components/ArticleCategoryManager';

const articleImageUrl = (article: CareArticle) =>
  article.thumbnailImageUrl || getUploadedImageUrl(article.thumbnailImageId);

const PAGE_SIZE = 8;

const capitalizeFirst = (value: string) => value
  ? `${value.charAt(0).toLocaleUpperCase('vi-VN')}${value.slice(1)}`
  : value;

const formatPublishedAt = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

interface PlantingAndCareProps {
  section?: ArticleSection;
  breadcrumbLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  isAdmin?: boolean;
}

export default function PlantingAndCare({
  section = 'cultivation',
  breadcrumbLabel = 'Trồng & chăm sóc',
  eyebrow = 'Kiến thức chăm sóc hoa lan',
  title = 'Cách Trồng & Chăm Sóc',
  description = 'Các bài hướng dẫn đã xuất bản từ hệ thống quản trị.',
  isAdmin = false,
}: PlantingAndCareProps) {
  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog();
  const [articles, setArticles] = useState<CareArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<CareArticle | null>(null);
  const [openingArticleId, setOpeningArticleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => (new URLSearchParams(window.location.search).get('cat') || '').split(',').filter(Boolean),
  );
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminEditorOpen, setAdminEditorOpen] = useState(false);
  const [adminEditingArticle, setAdminEditingArticle] = useState<CareArticle | null>(null);
  const [adminRevision, setAdminRevision] = useState(0);
  const [adminMessage, setAdminMessage] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const linkedArticleId = new URLSearchParams(window.location.search).get('articleId') ?? '';

  const categoryOptions = useMemo(() => {
    const result: Array<ArticleCategory & { depth: number }> = [];
    const childrenByParent = new Map<string | null, ArticleCategory[]>();
    categories.forEach((category) => {
      const parentId = category.parentId ?? null;
      childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), category]);
    });
    const visited = new Set<string>();
    const append = (parentId: string | null, depth: number) => {
      (childrenByParent.get(parentId) ?? [])
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        .forEach((category) => {
          if (visited.has(category.id)) return;
          visited.add(category.id);
          result.push({ ...category, depth });
          append(category.id, depth + 1);
        });
    };
    append(null, 0);
    categories
      .filter((category) => !visited.has(category.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .forEach((category) => result.push({ ...category, depth: 0 }));
    return result;
  }, [categories]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const loadArticleCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      setCategories(await getArticleCategories(section, { pageNumber: 1, pageSize: 100, sortBy: 'name' }));
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [section]);

  useEffect(() => {
    void loadArticleCategories();
  }, [loadArticleCategories]);

  useEffect(() => {
    let active = true;
    const loadArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const categoryRequests = selectedCategoryIds.length > 0 ? selectedCategoryIds : [undefined];
        const results = await Promise.all(categoryRequests.map((articleCategoryId) => getSectionArticles(section, {
            articleCategoryId,
            includeDescendants: true,
            searchTerm: debouncedSearchTerm || undefined,
            isPublished: isAdmin ? undefined : true,
            pageNumber: 1,
            pageSize: 100,
            sortDescending: true,
          })));
        const uniqueArticles = new Map<string, CareArticle>();
        results.flat().forEach((article) => uniqueArticles.set(article.id || article.title, article));
        if (active) setArticles([...uniqueArticles.values()]);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách bài viết.');
          setArticles([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadArticles();
    return () => { active = false; };
  }, [section, selectedCategoryIds, debouncedSearchTerm, isAdmin, adminRevision]);

  useEffect(() => {
    if (!linkedArticleId) return;
    let active = true;
    const loadTimer = window.setTimeout(() => {
      setOpeningArticleId(linkedArticleId);
      void getArticleById(linkedArticleId)
        .then((article) => { if (active) setSelectedArticle(article); })
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải nội dung bài viết.');
        })
        .finally(() => { if (active) setOpeningArticleId(null); });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [linkedArticleId]);

  const selectCategories = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    setSelectedArticle(null);
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    if (categoryIds.length > 0) params.set('cat', categoryIds.join(','));
    else params.delete('cat');
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    else params.delete('q');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategoryIds([]);
    setCurrentPage(1);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const openArticle = async (article: CareArticle) => {
    if (!article.id) return;
    setOpeningArticleId(article.id);
    setError('');
    try {
      setSelectedArticle(await getArticleById(article.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải nội dung bài viết.');
    } finally {
      setOpeningArticleId(null);
    }
  };

  const openAdminEditor = async (article?: CareArticle) => {
    if (!article?.id) {
      setAdminEditingArticle(null);
      setAdminEditorOpen(true);
      return;
    }
    setOpeningArticleId(article.id);
    try {
      setAdminEditingArticle(await getArticleById(article.id));
      setAdminEditorOpen(true);
    } catch (loadError) {
      setAdminMessage(loadError instanceof Error ? loadError.message : 'Không thể tải bài viết để chỉnh sửa.');
    } finally {
      setOpeningArticleId(null);
    }
  };

  const handleAdminDelete = async (article: CareArticle) => {
    if (!article.id || !(await confirmDelete({
      title: 'Xóa bài viết?',
      message: 'Bài viết sẽ bị gỡ khỏi website và không thể khôi phục.',
      itemName: article.title,
      confirmLabel: 'Xóa bài viết',
    }))) return;
    try {
      await deleteSectionArticle(section, article.id);
      if (selectedArticle?.id === article.id) setSelectedArticle(null);
      setAdminMessage('Đã xóa bài viết.');
      setAdminRevision((revision) => revision + 1);
    } catch (deleteError) {
      setAdminMessage(deleteError instanceof Error ? deleteError.message : 'Không thể xóa bài viết.');
    }
  };

  const filteredArticles = articles;
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 font-sans animate-fade-in md:px-16">
        <div className="mb-8 flex items-center space-x-2 text-xs font-medium tracking-wider text-[#747878]">
          <a href="/" className="flex items-center gap-1 transition-colors hover:text-botanical-green"><ArrowLeft size={14} /> Trang chủ</a>
          <span>&gt;</span>
          {selectedArticle ? (
            <>
              <button type="button" onClick={() => setSelectedArticle(null)} className="hover:text-[#56642b]">
                {capitalizeFirst(breadcrumbLabel)}
              </button>
              <span>&gt;</span>
              <span className="max-w-[55vw] truncate text-[#1a1c1b]" title={selectedArticle.title}>
                {capitalizeFirst(selectedArticle.title)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-[#1a1c1b]">{capitalizeFirst(breadcrumbLabel)}</span>
          )}
        </div>

        <PageIntro eyebrow={eyebrow} title={title} description={description} />

        {isAdmin && (
          <div className="mb-8 flex flex-col gap-3 rounded-xl border border-[#87905f]/35 bg-[#f1f4e7] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#667234]">Chế độ quản trị</p>
              <p className="mt-1 text-sm text-[#4f554e]">Bạn có thể thêm, sửa và xóa bài viết ngay tại trang này.</p>
              {adminMessage && <p className="mt-1 text-xs font-semibold text-[#56642b]">{adminMessage}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void openAdminEditor()} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#56642b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#44501f]">
                <Plus size={16} /> Thêm bài viết
              </button>
              <button type="button" onClick={() => setShowCategoryManager(true)} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#56642b] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#56642b] hover:bg-[#eef1e2]">
                <FolderTree size={16} /> Quản lý danh mục
              </button>
            </div>
          </div>
        )}

        {selectedArticle ? (
          <article className="w-full">
            {articleImageUrl(selectedArticle) && (
              <img
                src={articleImageUrl(selectedArticle)}
                alt={selectedArticle.title}
                className="mx-auto mb-8 block max-h-[520px] w-auto max-w-full rounded-xl border border-[#747878]/10 bg-white object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-block rounded bg-[#d6e7a1]/35 px-2.5 py-1 text-[10px] font-bold uppercase text-[#56642b]">
                {selectedArticle.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
              {formatPublishedAt(selectedArticle.publishedAt) && (
                <time className="flex items-center gap-1.5 text-xs text-[#747878]" dateTime={selectedArticle.publishedAt ?? undefined}>
                  <CalendarClock size={14} />
                  {formatPublishedAt(selectedArticle.publishedAt)}
                </time>
              )}
            </div>
            {isAdmin && (
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => void openAdminEditor(selectedArticle)} className="inline-flex items-center gap-2 rounded-md border border-[#56642b] px-3 py-2 text-xs font-bold text-[#56642b] hover:bg-[#eef1e2]"><Edit size={15} /> Sửa</button>
                <button type="button" onClick={() => void handleAdminDelete(selectedArticle)} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={15} /> Xóa</button>
              </div>
            )}
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">{selectedArticle.title}</h1>
            {selectedArticle.summary && (
              <p className="mt-5 border-l-2 border-[#56642b] pl-4 text-sm leading-7 text-[#5d625f]">
                {selectedArticle.summary}
              </p>
            )}
            <div 
              className="mt-9 border-t border-[#747878]/10 pt-8 text-sm leading-8 text-[#343837] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />
          </article>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <aside className="space-y-8 lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747878]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                  placeholder="Tìm kiếm..."
                  className="w-full rounded border border-[#747878]/20 bg-white p-3 pl-9 font-sans text-xs outline-none focus:border-botanical-green"
                />
              </div>

              <div className="space-y-4">
                <h4 className="border-b border-[#747878]/10 pb-2 font-sans text-[11px] font-bold uppercase tracking-widest text-[#1a1c1b]">Phân loại nội dung</h4>
                <InlineTreeMultiSelect
                  options={categoryOptions.map((category) => ({ value: category.id, label: category.name, depth: category.depth }))}
                  values={selectedCategoryIds}
                  onChange={selectCategories}
                  allLabel="Tất cả danh mục"
                  emptyMessage={loadingCategories ? 'Đang tải danh mục...' : 'Chưa có danh mục.'}
                />
              </div>

              {(searchTerm || selectedCategoryIds.length > 0) && (
                <button onClick={clearFilters} className="w-full rounded-md border border-dashed border-red-200 py-2.5 text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-red-600 transition-all hover:border-red-500 hover:bg-red-50/50">
                  Xóa bộ lọc
                </button>
              )}
            </aside>

            <section className="min-w-0 space-y-12 lg:col-span-9">
              <div className="flex items-center justify-between border-b border-[#747878]/10 pb-3 font-sans text-xs text-[#747878]">
                <span>{loading ? 'Đang tải bài viết...' : `Đang hiển thị ${filteredArticles.length} bài viết`}</span>
                {(searchTerm || selectedCategoryIds.length > 0) && <span className="rounded-[2px] bg-[#56642b]/10 px-2 py-0.5 text-[10px] font-semibold text-botanical-green">ĐÃ LỌC</span>}
              </div>

              {loading ? (
                <div className="flex justify-center py-24 text-[#56642b]"><LoaderCircle className="animate-spin" /></div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm text-red-700">{error}</div>
              ) : filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 rounded-md border border-[#747878]/10 bg-white py-24 text-center">
                  <X size={32} className="text-[#747878]/30" />
                  <p className="font-sans text-xs italic text-[#747878]">Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.</p>
                  <button onClick={clearFilters} className="mt-2 font-sans text-xs font-bold uppercase tracking-widest text-botanical-green hover:underline">Xóa tất cả bộ lọc</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                  {paginatedArticles.map((article) => {
                    const imageUrl = articleImageUrl(article);
                    return (
                      <div key={article.id} className="relative overflow-hidden rounded-md border border-[#747878]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <button onClick={() => void openArticle(article)} disabled={openingArticleId === article.id} className="group w-full text-left disabled:cursor-wait disabled:opacity-70 sm:flex sm:min-h-48">
                        {imageUrl ? (
                          <img src={imageUrl} alt={article.title} className="h-40 w-full shrink-0 bg-white object-cover sm:h-auto sm:w-40 lg:w-44" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-40 w-full shrink-0 items-center justify-center bg-[#f0f1ec] text-[#90958d] sm:h-auto sm:w-40 lg:w-44"><FileText size={30} /></div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#56642b]">{article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
                            {formatPublishedAt(article.publishedAt) && (
                              <time className="flex items-center gap-1 text-[10px] text-[#747878]" dateTime={article.publishedAt ?? undefined}>
                                <CalendarClock size={12} />
                                {formatPublishedAt(article.publishedAt)}
                              </time>
                            )}
                          </div>
                          <h3 className="mt-2 line-clamp-2 font-serif text-lg font-bold leading-snug transition-colors group-hover:text-[#56642b]">{article.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#686d6a]">{article.summary || article.content.replace(/<[^>]+>/g, '')}</p>
                          <span className="mt-auto pt-3 text-[10px] font-bold uppercase tracking-wider text-[#56642b]">{openingArticleId === article.id ? 'Đang tải...' : 'Đọc tiếp →'}</span>
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md bg-white/95 p-1 shadow-md">
                          <button type="button" onClick={() => void openAdminEditor(article)} className="rounded p-2 text-[#56642b] hover:bg-[#eef1e2]" title="Sửa bài viết"><Edit size={15} /></button>
                          <button type="button" onClick={() => void handleAdminDelete(article)} className="rounded p-2 text-red-600 hover:bg-red-50" title="Xóa bài viết"><Trash2 size={15} /></button>
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-6">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} className={`flex items-center justify-center rounded-md border border-[#747878]/20 p-2 transition-all ${currentPage === 1 ? 'cursor-not-allowed bg-transparent text-[#747878]/30' : 'bg-white text-[#1a1c1b] hover:border-botanical-green hover:shadow-sm'}`}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`flex h-9 w-9 items-center justify-center rounded-md border font-sans text-xs font-semibold tracking-wider transition-all ${currentPage === page ? 'border-botanical-green bg-botanical-green text-white shadow-sm' : 'border-[#747878]/20 bg-white text-[#1a1c1b] hover:border-botanical-green'}`}>
                      {page}
                    </button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} className={`flex items-center justify-center rounded-md border border-[#747878]/20 p-2 transition-all ${currentPage === totalPages ? 'cursor-not-allowed bg-transparent text-[#747878]/30' : 'bg-white text-[#1a1c1b] hover:border-botanical-green hover:shadow-sm'}`}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <PublicFooter />
      {isAdmin && (
        <PublicArticleAdminModal
          section={section}
          article={adminEditingArticle}
          categories={categories}
          isOpen={adminEditorOpen}
          onClose={() => { setAdminEditorOpen(false); setAdminEditingArticle(null); }}
          onSaved={(message) => { setAdminMessage(message); setAdminRevision((revision) => revision + 1); }}
        />
      )}
      {isAdmin && showCategoryManager && (
        <div className="fixed inset-0 z-[90] bg-[#111412]/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`Quản lý danh mục ${breadcrumbLabel}`}>
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f9f9f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dedfd9] bg-white px-6 py-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71803c]">Quản trị nhanh</p><h2 className="font-serif text-2xl font-bold">Danh mục {breadcrumbLabel}</h2></div>
              <button type="button" onClick={() => setShowCategoryManager(false)} className="rounded-full p-2 text-[#747878] hover:bg-[#f0f1ec]" aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-7">
              <ArticleCategoryManager
                section={section}
                title={section === 'application' ? 'Quản lý danh mục ứng dụng' : 'Quản lý danh mục trồng & chăm sóc'}
                categories={categories}
                loading={loadingCategories}
                onReload={loadArticleCategories}
                notify={(message) => setAdminMessage(message)}
              />
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
