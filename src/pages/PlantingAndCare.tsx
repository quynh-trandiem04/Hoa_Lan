import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, LoaderCircle, User } from 'lucide-react';
import type { CareArticle } from '../types';
import { getArticles, getUploadedImageUrl } from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';

const articleImageUrl = (article: CareArticle) =>
  article.thumbnailImageUrl || getUploadedImageUrl(article.thumbnailImageId);

export default function PlantingAndCare() {
  const [articles, setArticles] = useState<CareArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<CareArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getArticles({
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
  }, []);

  const filteredArticles = articles;

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#747878]">
          <a href="/" className="hover:text-[#56642b]">Trang chủ</a>
          <span>›</span>
          {selectedArticle ? (
            <>
              <button type="button" onClick={() => setSelectedArticle(null)} className="hover:text-[#56642b]">
                Trồng &amp; chăm sóc
              </button>
              <span>›</span>
              <span className="max-w-[55vw] truncate text-[#1a1c1b]" title={selectedArticle.title}>
                {selectedArticle.title}
              </span>
            </>
          ) : (
            <span className="text-[#1a1c1b]">Trồng &amp; chăm sóc</span>
          )}
        </div>

        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#56642b]">Kiến thức chăm sóc hoa lan</p>
            <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Cách Trồng &amp; Chăm Sóc</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#686d6a]">Các bài hướng dẫn đã xuất bản từ hệ thống quản trị.</p>
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
            <div className="mt-9 whitespace-pre-line border-t border-[#747878]/10 pt-8 text-sm leading-8 text-[#343837]">
              {selectedArticle.content}
            </div>
          </article>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between border-b border-[#747878]/10 pb-3">
              <h2 className="font-serif text-xl font-bold">Tất cả bài viết</h2>
              <span className="text-xs text-[#747878]">Tìm thấy {filteredArticles.length} bài viết</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-24 text-[#56642b]"><LoaderCircle className="animate-spin" /></div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm text-red-700">{error}</div>
            ) : filteredArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfd2cb] bg-white py-20 text-center">
                <FileText className="mx-auto mb-3 text-[#92978f]" />
                <p className="font-serif text-xl font-bold">Không có bài viết phù hợp</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => {
                  const imageUrl = articleImageUrl(article);
                  return (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="overflow-hidden rounded-xl border border-[#e0e1dc] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="h-44 w-full bg-white object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-[#f0f1ec] text-[#90958d]">
                          <FileText size={30} />
                        </div>
                      )}
                      <div className="p-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#56642b]">Đã xuất bản</span>
                        <h3 className="mt-2 line-clamp-2 font-serif text-xl font-bold leading-snug">{article.title}</h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#686d6a]">{article.summary || article.content}</p>
                        <span className="mt-5 inline-block text-xs font-bold uppercase tracking-wider text-[#56642b]">Đọc tiếp →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
