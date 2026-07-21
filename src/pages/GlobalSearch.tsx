import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Leaf, LoaderCircle, Search, Sparkles } from 'lucide-react';
import type { CareArticle, DocumentItem, Orchid } from '../types';
import { getDocuments, getOrchids, getSectionArticles } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';

interface SearchResults {
  orchids: Orchid[];
  documents: DocumentItem[];
  cultivation: CareArticle[];
  applications: CareArticle[];
}

const EMPTY_RESULTS: SearchResults = { orchids: [], documents: [], cultivation: [], applications: [] };

const plainText = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function GlobalSearch() {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q')?.trim() ?? '');
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;

    let active = true;
    const loadTimer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      void Promise.allSettled([
        getOrchids({ pageNumber: 1, pageSize: 50, searchTerm: query }),
        getDocuments(1, 50, query),
        getSectionArticles('cultivation', { pageNumber: 1, pageSize: 50, searchTerm: query, isPublished: true }),
        getSectionArticles('application', { pageNumber: 1, pageSize: 50, searchTerm: query, isPublished: true }),
      ]).then(([orchids, documents, cultivation, applications]) => {
        if (!active) return;
        const nextResults: SearchResults = {
          orchids: orchids.status === 'fulfilled' ? orchids.value : [],
          documents: documents.status === 'fulfilled' ? documents.value.items ?? [] : [],
          cultivation: cultivation.status === 'fulfilled' ? cultivation.value : [],
          applications: applications.status === 'fulfilled' ? applications.value : [],
        };
        setResults(nextResults);
        if ([orchids, documents, cultivation, applications].every((result) => result.status === 'rejected')) {
          setError('Không thể tải kết quả tìm kiếm. Vui lòng thử lại.');
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [query]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = input.trim();
    setQuery(keyword);
    if (!keyword) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setError('');
    }
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    window.history.replaceState(null, '', `/search${params.size ? `?${params.toString()}` : ''}`);
  };

  const totalResults = results.orchids.length + results.documents.length + results.cultivation.length + results.applications.length;

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#56642b]">Tra cứu toàn hệ thống</p>
        <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Tìm kiếm</h1>
        <form onSubmit={handleSearch} className="mt-7 flex w-full overflow-hidden rounded-lg border border-[#cfd2cb] bg-white shadow-sm focus-within:border-[#56642b]">
          <Search className="ml-4 h-5 w-5 shrink-0 self-center text-[#899073]" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm outline-none"
            placeholder="Tìm loài lan, tài liệu, cách trồng và ứng dụng..."
            autoFocus
          />
          <button type="submit" className="shrink-0 bg-[#56642b] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#445022]">Tìm kiếm</button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-[#56642b]"><LoaderCircle className="animate-spin" /> Đang tìm kiếm...</div>
        ) : error ? (
          <div className="mt-8 border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
        ) : !query ? (
          <div className="py-24 text-center text-sm text-[#747878]">Nhập từ khóa để tìm kiếm trên toàn bộ nội dung.</div>
        ) : totalResults === 0 ? (
          <div className="mt-8 border border-dashed border-[#cfd2cb] bg-white p-16 text-center">
            <Search className="mx-auto mb-3 text-[#92978f]" />
            <p className="font-serif text-xl font-bold">Không tìm thấy kết quả cho “{query}”</p>
          </div>
        ) : (
          <div className="mt-9 space-y-10">
            <p className="text-sm text-[#747878]">Tìm thấy <strong className="text-[#1a1c1b]">{totalResults}</strong> kết quả cho “{query}”.</p>

            {results.orchids.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold"><Leaf size={19} className="text-[#56642b]" /> Loài lan <span className="text-sm font-normal text-[#899073]">({results.orchids.length})</span></h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.orchids.map((orchid) => (
                    <a key={orchid.id} href={`/orchids/${encodeURIComponent(orchid.id ?? '')}`} className="border border-[#e0e1dc] bg-white p-5 transition-all hover:border-[#899073] hover:shadow-md">
                      <h3 className="font-serif text-lg font-bold">{orchid.name}</h3>
                      {orchid.englishName && <p className="mt-1 text-xs italic text-[#899073]">{orchid.englishName}</p>}
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#666b69]">{orchid.shortDescription}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {results.documents.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold"><FileText size={19} className="text-[#56642b]" /> Tài liệu <span className="text-sm font-normal text-[#899073]">({results.documents.length})</span></h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.documents.map((document) => (
                    <a key={document.id ?? document.url} href={document.url} target="_blank" rel="noreferrer" className="border border-[#e0e1dc] bg-white p-5 transition-all hover:border-[#899073] hover:shadow-md">
                      <h3 className="font-serif text-lg font-bold">{document.title}</h3>
                      <p className="mt-1 truncate text-xs text-[#899073]">{document.originalName}</p>
                      {document.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#666b69]">{document.description}</p>}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {results.cultivation.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold"><BookOpen size={19} className="text-[#56642b]" /> Cách trồng và chăm sóc <span className="text-sm font-normal text-[#899073]">({results.cultivation.length})</span></h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.cultivation.map((article) => (
                    <a key={article.id} href={`/planting-and-care?articleId=${encodeURIComponent(article.id ?? '')}`} className="border border-[#e0e1dc] bg-white p-5 transition-all hover:border-[#899073] hover:shadow-md">
                      <h3 className="font-serif text-lg font-bold">{article.title}</h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#666b69]">{plainText(article.summary || article.content)}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {results.applications.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold"><Sparkles size={19} className="text-[#56642b]" /> Ứng dụng <span className="text-sm font-normal text-[#899073]">({results.applications.length})</span></h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.applications.map((article) => (
                    <a key={article.id} href={`/applications?articleId=${encodeURIComponent(article.id ?? '')}`} className="border border-[#e0e1dc] bg-white p-5 transition-all hover:border-[#899073] hover:shadow-md">
                      <h3 className="font-serif text-lg font-bold">{article.title}</h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#666b69]">{plainText(article.summary || article.content)}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
