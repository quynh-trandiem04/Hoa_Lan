import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, LockKeyhole, MessageSquare, RefreshCw, Search, Send, Trash2, X } from 'lucide-react';
import {
  createDiscussion,
  createDiscussionComment,
  getDiscussionById,
  getDiscussions,
  uploadImage,
  type DiscussionPostDto,
  type UploadedImage,
} from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';

const LOGIN_URL = `/login?returnUrl=${encodeURIComponent('/discussion')}`;

const hasAuthToken = () => Boolean(
  localStorage.getItem('orchidee_auth_token')
  || sessionStorage.getItem('orchidee_auth_token'),
);

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(-2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const DISCUSSION_IMAGE_PATTERN = /\n*!\[Ảnh đính kèm\]\((https?:\/\/[^\s)]+)\)\s*$/i;

const getDiscussionBody = (value: string) => {
  const match = value.match(DISCUSSION_IMAGE_PATTERN);
  return {
    text: value.replace(DISCUSSION_IMAGE_PATTERN, '').trim(),
    imageUrl: match?.[1] ?? '',
  };
};

function ZoomableDiscussionImage({ src, alt }: { src: string; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [lens, setLens] = useState({
    visible: false,
    left: 0,
    top: 0,
    xPercent: 50,
    yPercent: 50,
    imageWidth: 0,
    imageHeight: 0,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const image = imageRef.current;
    if (!image) return;

    const containerBounds = event.currentTarget.getBoundingClientRect();
    const imageBounds = image.getBoundingClientRect();
    const isInsideImage = event.clientX >= imageBounds.left
      && event.clientX <= imageBounds.right
      && event.clientY >= imageBounds.top
      && event.clientY <= imageBounds.bottom;

    if (!isInsideImage) {
      setLens((current) => ({ ...current, visible: false }));
      return;
    }

    setLens({
      visible: true,
      left: event.clientX - containerBounds.left,
      top: event.clientY - containerBounds.top,
      xPercent: ((event.clientX - imageBounds.left) / imageBounds.width) * 100,
      yPercent: ((event.clientY - imageBounds.top) / imageBounds.height) * 100,
      imageWidth: imageBounds.width,
      imageHeight: imageBounds.height,
    });
  };

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="relative mt-4 flex cursor-crosshair justify-center overflow-hidden rounded-xl border border-[#e0e1dc] bg-[#f4f4f0]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLens((current) => ({ ...current, visible: false }))}
      title="Di chuột để phóng to, nhấn để mở ảnh gốc"
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="block h-auto w-auto max-w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {lens.visible && (
        <span
          aria-hidden="true"
          data-zoom-lens="true"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-white shadow-2xl"
          style={{
            display: 'block',
            width: 176,
            height: 176,
            left: lens.left,
            top: lens.top,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${lens.imageWidth * 2.5}px ${lens.imageHeight * 2.5}px`,
            backgroundPosition: `${lens.xPercent}% ${lens.yPercent}%`,
          }}
        />
      )}
    </a>
  );
}

export default function Discussion() {
  const [posts, setPosts] = useState<DiscussionPostDto[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<UploadedImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPosts = useCallback(async (term = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await getDiscussions({ pageNumber: 1, pageSize: 50, searchTerm: term || undefined });
      setPosts(result.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách thảo luận.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(new URLSearchParams(window.location.search).get('q') ?? '');
  }, [loadPosts]);

  const requireLogin = () => {
    const loggedIn = hasAuthToken();
    if (loggedIn) return true;
    setShowLoginPrompt(true);
    return false;
  };

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireLogin()) return;
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const discussionContent = attachedImage?.url
        ? `${content.trim()}\n\n![Ảnh đính kèm](${attachedImage.url})`
        : content.trim();
      const id = await createDiscussion({ title: title.trim(), content: discussionContent });
      const created = await getDiscussionById(id);
      setPosts((current) => [created, ...current.filter((post) => post.id !== id)]);
      setTitle('');
      setContent('');
      setAttachedImage(null);
      setNotice('Đăng bài thảo luận thành công.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể đăng bài thảo luận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!requireLogin()) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn đúng tệp ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh không được lớn hơn 10 MB.');
      return;
    }

    setUploadingImage(true);
    setError('');
    setNotice('');
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded.url) throw new Error('API đã tải ảnh nhưng không trả về URL ảnh.');
      setAttachedImage(uploaded);
      setNotice('Tải ảnh lên thành công.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleComment = async (postId: string) => {
    if (!requireLogin()) return;
    const comment = commentInputs[postId]?.trim();
    if (!comment || commentingId) return;
    setCommentingId(postId);
    setError('');
    setNotice('');
    try {
      await createDiscussionComment(postId, comment);
      const refreshed = await getDiscussionById(postId);
      setPosts((current) => current.map((post) => post.id === postId ? refreshed : post));
      setCommentInputs((current) => ({ ...current, [postId]: '' }));
      setNotice('Đã gửi bình luận.');
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Không thể gửi bình luận.');
    } finally {
      setCommentingId(null);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void loadPosts(searchTerm.trim());
  };

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#747878]">
          <a href="/" className="hover:text-[#56642b]">Trang chủ</a>
          <span>›</span>
          <span className="text-[#1a1c1b]">Thảo luận</span>
        </div>

        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#56642b]">Cộng đồng người yêu lan</p>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">Thảo luận &amp; chia sẻ</h1>
            <p className="mt-2 text-sm text-[#666b69]">Đặt câu hỏi, trao đổi kinh nghiệm và cùng chăm sóc hoa lan tốt hơn.</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full max-w-sm overflow-hidden rounded-lg border border-[#d5d7d3] bg-white">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
              placeholder="Tìm bài thảo luận..."
            />
            <button className="px-3 text-[#56642b]" aria-label="Tìm kiếm"><Search size={18} /></button>
          </form>
        </div>

        {(error || notice) && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || notice}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-5">
            <form onSubmit={handleCreatePost} className="rounded-xl border border-[#e0e1dc] bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-serif text-xl font-bold">Tạo bài thảo luận</h2>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Tiêu đề *</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  className="mb-4 w-full rounded-lg border border-[#d5d7d3] px-3 py-2.5 text-sm outline-none focus:border-[#56642b]"
                  placeholder="Ví dụ: Lan Hồ Điệp bị vàng lá phải xử lý thế nào?"
                />
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Nội dung *</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[#d5d7d3] px-3 py-2.5 text-sm outline-none focus:border-[#56642b]"
                  placeholder="Mô tả vấn đề hoặc chia sẻ kinh nghiệm của bạn..."
                />
                <div className="mt-4 rounded-lg border border-dashed border-[#cfd2cb] bg-[#fafaf7] p-3">
                  {attachedImage ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={attachedImage.url}
                        alt="Ảnh đính kèm bài thảo luận"
                        className="h-20 w-24 shrink-0 rounded-md border border-[#dfe1dc] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1a1c1b]">{attachedImage.fileName || 'Ảnh đính kèm'}</p>
                        <p className="mt-1 text-xs text-[#747878]">Ảnh đã tải lên và sẽ xuất hiện trong bài viết.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        disabled={submitting || uploadingImage}
                        className="rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        aria-label="Gỡ ảnh đính kèm"
                        title="Gỡ ảnh"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-[#56642b] transition-colors ${uploadingImage ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-[#edf1e2]'}`}>
                      {uploadingImage ? <LoaderCircle size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                      {uploadingImage ? 'Đang tải ảnh lên...' : 'Thêm ảnh từ máy tính'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={uploadingImage || submitting}
                        onChange={(event) => void handleImageUpload(event)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-[#747878]">Hỗ trợ JPG, PNG, WEBP hoặc GIF, tối đa 10 MB.</p>
                <div className="mt-4 flex justify-end">
                  <button disabled={submitting || uploadingImage} className="flex items-center gap-2 rounded-lg bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60">
                    {submitting && <LoaderCircle size={15} className="animate-spin" />}
                    {submitting ? 'Đang đăng...' : 'Đăng bài'}
                  </button>
                </div>
            </form>

            {loading ? (
              <div className="flex justify-center rounded-xl border border-[#e0e1dc] bg-white py-16 text-[#56642b]"><LoaderCircle className="animate-spin" /></div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfd2cb] bg-white p-12 text-center">
                <MessageSquare className="mx-auto mb-3 text-[#899073]" />
                <p className="font-serif text-xl font-bold">Chưa có bài thảo luận</p>
                <p className="mt-1 text-sm text-[#747878]">Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ kinh nghiệm.</p>
              </div>
            ) : posts.map((post) => {
              const postBody = getDiscussionBody(post.content);
              return (
              <article key={post.id} className="rounded-xl border border-[#e0e1dc] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8edda] text-xs font-bold text-[#56642b]">{initials(post.authorName)}</div>
                  <div>
                    <p className="text-sm font-bold">{post.authorName || 'Thành viên'}</p>
                    <time className="text-xs text-[#747878]">{formatDate(post.createdAt)}</time>
                  </div>
                </div>
                <h2 className="font-serif text-xl font-bold">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#434748]">{postBody.text}</p>
                {postBody.imageUrl && (
                  <ZoomableDiscussionImage
                    src={postBody.imageUrl}
                    alt={`Ảnh trong bài ${post.title}`}
                  />
                )}
                <div className="my-5 flex items-center gap-2 border-y border-[#eeeeea] py-3 text-xs text-[#666b69]">
                  <MessageSquare size={16} />
                  <span>{post.commentCount ?? post.comments?.length ?? 0} bình luận</span>
                </div>

                <div className="space-y-3">
                  {(post.comments ?? []).map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f1ec] text-[10px] font-bold text-[#56642b]">{initials(comment.authorName)}</div>
                      <div className="min-w-0 flex-1 rounded-lg bg-[#f7f7f3] px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-xs">{comment.authorName || 'Thành viên'}</strong>
                          <time className="text-[10px] text-[#747878]">{formatDate(comment.createdAt)}</time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#434748]">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#dfe1dc] bg-[#fafaf7] px-3 py-1.5">
                    <input
                      value={commentInputs[post.id] ?? ''}
                      onChange={(event) => setCommentInputs((current) => ({ ...current, [post.id]: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleComment(post.id);
                        }
                      }}
                      className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
                      placeholder="Viết bình luận..."
                    />
                    <button
                      type="button"
                      disabled={commentingId === post.id || !commentInputs[post.id]?.trim()}
                      onClick={() => void handleComment(post.id)}
                      className="rounded-full p-2 text-[#56642b] disabled:opacity-40"
                      aria-label="Gửi bình luận"
                    >
                      {commentingId === post.id ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
                    </button>
                </div>
              </article>
              );
            })}
          </section>

          <aside className="space-y-5">
            <section className="rounded-xl border border-[#e0e1dc] bg-white p-5 shadow-sm">
              <h2 className="font-serif text-lg font-bold">Quy tắc cộng đồng</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#555a58]">
                <li>• Trao đổi lịch sự và tôn trọng thành viên khác.</li>
                <li>• Không mua bán, khai thác hoa lan trái phép.</li>
                <li>• Không đăng nội dung quảng cáo hoặc spam.</li>
              </ul>
            </section>
            <button onClick={() => void loadPosts(searchTerm.trim())} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#56642b] px-4 py-2.5 text-sm font-semibold text-[#56642b] disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới dữ liệu
            </button>
          </aside>
        </div>
      </main>
      <PublicFooter />

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-required-title"
          onMouseDown={() => setShowLoginPrompt(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#dfe2d7] bg-[#fffef9] p-7 text-center shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#747878] transition-colors hover:bg-[#56642b]/10 hover:text-[#56642b]"
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf1e2] text-[#56642b]">
              <LockKeyhole size={25} />
            </div>
            <h2 id="login-required-title" className="font-serif text-2xl font-bold text-[#1a1c1b]">Bạn cần đăng nhập</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#666b69]">
              Vui lòng đăng nhập tài khoản để có thể đăng bài thảo luận hoặc gửi bình luận.
            </p>
            <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="rounded-lg border border-[#cfd2cb] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#434748]"
              >
                Để sau
              </button>
              <a
                href={LOGIN_URL}
                className="rounded-lg bg-[#56642b] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Đi đến đăng nhập
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
