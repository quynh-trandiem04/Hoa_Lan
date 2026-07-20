import React, { useEffect, useState } from 'react';
import { Calendar, Download, Eye, FileText, HardDrive } from 'lucide-react';
import type { DocumentItem } from '../types';
import { getDocuments } from '../services/api';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getDocuments(1, 100);
        if (active) setDocuments(result.items ?? []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách tài liệu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

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

      <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#747878]">
          <a href="/" className="hover:text-[#56642b]">Trang chủ</a>
          <span>›</span>
          <span className="text-[#1a1c1b]">Tài nguyên</span>
        </div>

        <section className="mb-12 max-w-3xl">
          <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">Thư Viện Tài Liệu Hoa Lan</h1>
          <p className="mt-4 text-base leading-7 text-[#434748]">
            Nơi lưu trữ các nghiên cứu khoa học, sách chuyên khảo và tài liệu kỹ thuật về các loài lan, cung cấp nền tảng kiến thức chuyên sâu cho giới học thuật và người yêu lan.
          </p>
        </section>

        {loading ? (
          <div className="py-20 text-center text-sm text-[#747878]">Đang tải danh sách tài liệu...</div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">{error}</div>
        ) : documents.length === 0 ? (
          <div className="border border-dashed border-[#cfd2cb] bg-white px-6 py-20 text-center">
            <FileText className="mx-auto mb-3 text-[#92978f]" />
            <p className="font-serif text-xl font-bold">Chưa có tài liệu</p>
          </div>
        ) : (
          <section className="space-y-6">
            {documents.map((document) => (
              <article key={document.id} className="relative flex flex-col gap-5 border border-[#eeeeea] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.035)] sm:flex-row sm:items-start">
                <div className="flex h-[76px] w-[60px] shrink-0 flex-col items-center justify-center rounded border border-[#dedfdb] bg-[#f4f4f2] text-red-500">
                  <FileText size={29} strokeWidth={1.8} />
                  <span className="mt-1 text-[9px] font-bold uppercase text-[#555a58]">{document.extension || 'FILE'}</span>
                </div>

                <div className="min-w-0 flex-1 pr-0 sm:pr-28">
                  <h2 className="font-serif text-xl font-bold leading-snug">{document.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#747878]">
                    <span className="max-w-full truncate">Tệp: {document.originalName}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Ngày: {formatDate(document.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><HardDrive size={13} /> Dung lượng: {formatFileSize(document.sizeBytes)}</span>
                  </div>

                  {document.description && (
                    <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-6 text-[#434748]">{document.description}</p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => void handleDownload(document)}
                      disabled={downloadingId === (document.id ?? document.url)}
                      className="flex items-center gap-2 border border-[#8a6b00] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#735c00] transition-colors hover:bg-[#735c00] hover:text-white"
                    >
                      <Download size={14} />
                      {downloadingId === (document.id ?? document.url) ? 'Đang tải...' : 'Tải xuống'}
                    </button>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#747878] transition-colors hover:text-[#56642b]"
                    >
                      <Eye size={14} /> Xem trước
                    </a>
                  </div>
                </div>

                <span className="absolute right-5 top-5 rounded bg-[#d6e7a1]/70 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#56642b]">
                  {document.extension || 'Tài liệu'}
                </span>
              </article>
            ))}
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
