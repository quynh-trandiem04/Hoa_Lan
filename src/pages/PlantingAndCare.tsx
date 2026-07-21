import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, LoaderCircle, Search, X } from 'lucide-react';
import type { ArticleCategory, CareArticle } from '../types';
import { getArticleById, getArticleCategories, getSectionArticles, getUploadedImageUrl, type ArticleSection } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';

const articleImageUrl = (article: CareArticle) =>
  article.thumbnailImageUrl || getUploadedImageUrl(article.thumbnailImageId);

const PAGE_SIZE = 8;

interface PlantingAndCareProps {
  section?: ArticleSection;
  breadcrumbLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export default function PlantingAndCare({
  section = 'cultivation',
  breadcrumbLabel = 'Trồng & chăm sóc',
  eyebrow = 'Kiến thức chăm sóc hoa lan',
  title = 'Cách Trồng & Chăm Sóc',
  description = 'Các bài hướng dẫn đã xuất bản từ hệ thống quản trị.',
}: PlantingAndCareProps) {
  const [articles, setArticles] = useState<CareArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<CareArticle | null>(null);
  const [openingArticleId, setOpeningArticleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('cat') || undefined,
  );
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const linkedArticleId = new URLSearchParams(window.location.search).get('articleId') ?? '';

  const categoryOptions = useMemo(() => {
    const result: Array<ArticleCategory & { depth: number }> = [];
    const visited = new Set<string>();
    const append = (parentId: string | null, depth: number) => {
      categories
        .filter((category) => (category.parentId ?? null) === parentId)
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

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    void getArticleCategories(section, { pageNumber: 1, pageSize: 100, sortBy: 'name' })
      .then((result) => { if (active) setCategories(result); })
      .catch(() => { if (active) setCategories([]); })
      .finally(() => { if (active) setLoadingCategories(false); });
    return () => { active = false; };
  }, [section]);

  useEffect(() => {
    let active = true;
    const loadArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getSectionArticles(section, {
          articleCategoryId: selectedCategoryId,
          includeDescendants: true,
          searchTerm: debouncedSearchTerm || undefined,
          isPublished: true,
          pageNumber: 1,
          pageSize: 100,
          sortDescending: true,
        });
        if (active) setArticles(result);
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
  }, [section, selectedCategoryId, debouncedSearchTerm]);

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

  const selectCategory = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedArticle(null);
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    if (categoryId) params.set('cat', categoryId);
    else params.delete('cat');
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    else params.delete('q');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategoryId(undefined);
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

  const filteredArticles = articles;
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 font-sans animate-fade-in md:px-16">
        <div className="mb-8 flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-[#747878]">
          <a href="/" className="flex items-center gap-1 transition-colors hover:text-botanical-green"><ArrowLeft size={14} /> Trang chủ</a>
          <span>&gt;</span>
          {selectedArticle ? (
            <>
              <button type="button" onClick={() => setSelectedArticle(null)} className="hover:text-[#56642b]">
                {breadcrumbLabel}
              </button>
              <span>›</span>
              <span className="max-w-[55vw] truncate text-[#1a1c1b]" title={selectedArticle.title}>
                {selectedArticle.title}
              </span>
            </>
          ) : (
            <span className="text-[#1a1c1b]">{breadcrumbLabel}</span>
          )}
        </div>

        <div className="mb-12 max-w-3xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#56642b]">{eyebrow}</p>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-charcoal-text md:text-4xl">{title}</h1>
            <p className="mt-3 font-sans text-xs leading-relaxed text-[#747878] md:text-sm">{description}</p>
          </div>
        </div>

        {selectedArticle ? (
          <article className="w-full">
            <button
              onClick={() => setSelectedArticle(null)}
              className="mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#56642b] hover:underline"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>

            {articleImageUrl(selectedArticle) && (
              <img
                src={articleImageUrl(selectedArticle)}
                alt={selectedArticle.title}
                className="mx-auto mb-8 block max-h-[520px] w-auto max-w-full rounded-xl border border-[#747878]/10 bg-white object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            <span className="inline-block rounded bg-[#d6e7a1]/35 px-2.5 py-1 text-[10px] font-bold uppercase text-[#56642b]">
              Đã xuất bản
            </span>
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
                <div className="max-h-[430px] space-y-2.5 overflow-y-auto pr-2 custom-scrollbar">
                  <label className="group flex cursor-pointer select-none items-center space-x-3 font-sans text-xs text-[#1a1c1b]/80">
                    <input type="checkbox" checked={!selectedCategoryId} onChange={() => selectCategory(undefined)} className="h-4 w-4 rounded-[2px] border-[#747878]/30 text-botanical-green accent-botanical-green focus:ring-botanical-green/20" />
                    <span>Tất cả danh mục</span>
                  </label>
                  {categoryOptions.map((category) => (
                    <label key={category.id} className="group flex cursor-pointer select-none items-center space-x-3 font-sans text-xs text-[#1a1c1b]/80" style={{ paddingLeft: `${category.depth * 18}px` }}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryId === category.id}
                        onChange={() => selectCategory(selectedCategoryId === category.id ? undefined : category.id)}
                        className="h-4 w-4 shrink-0 rounded-[2px] border-[#747878]/30 text-botanical-green accent-botanical-green focus:ring-botanical-green/20"
                      />
                      <span className="transition-colors group-hover:text-botanical-green">{category.name}</span>
                    </label>
                  ))}
                  {!loadingCategories && categoryOptions.length === 0 && <p className="text-xs text-[#858a85]">Chưa có danh mục.</p>}
                  {loadingCategories && <p className="text-xs text-[#858a85]">Đang tải danh mục...</p>}
                </div>
              </div>

              {(searchTerm || selectedCategoryId) && (
                <button onClick={clearFilters} className="w-full rounded-md border border-dashed border-red-200 py-2.5 text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-red-600 transition-all hover:border-red-500 hover:bg-red-50/50">
                  Xóa bộ lọc
                </button>
              )}
            </aside>

            <section className="min-w-0 space-y-12 lg:col-span-9">
              <div className="flex items-center justify-between border-b border-[#747878]/10 pb-3 font-sans text-xs text-[#747878]">
                <span>{loading ? 'Đang tải bài viết...' : `Đang hiển thị ${filteredArticles.length} bài viết`}</span>
                {(searchTerm || selectedCategoryId) && <span className="rounded-[2px] bg-[#56642b]/10 px-2 py-0.5 text-[10px] font-semibold text-botanical-green">ĐÃ LỌC</span>}
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
                      <button key={article.id} onClick={() => void openArticle(article)} disabled={openingArticleId === article.id} className="group overflow-hidden rounded-md border border-[#747878]/10 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-70 sm:flex sm:min-h-48">
                        {imageUrl ? (
                          <img src={imageUrl} alt={article.title} className="h-40 w-full shrink-0 bg-white object-cover sm:h-auto sm:w-40 lg:w-44" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-40 w-full shrink-0 items-center justify-center bg-[#f0f1ec] text-[#90958d] sm:h-auto sm:w-40 lg:w-44"><FileText size={30} /></div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#56642b]">Đã xuất bản</span>
                          <h3 className="mt-2 line-clamp-2 font-serif text-lg font-bold leading-snug transition-colors group-hover:text-[#56642b]">{article.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#686d6a]">{article.summary || article.content.replace(/<[^>]+>/g, '')}</p>
                          <span className="mt-auto pt-3 text-[10px] font-bold uppercase tracking-wider text-[#56642b]">{openingArticleId === article.id ? 'Đang tải...' : 'Đọc tiếp →'}</span>
                        </div>
                      </button>
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
    </div>
  );
}
