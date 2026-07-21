import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, LockKeyhole, MessageSquare, MoreHorizontal, RefreshCw, Search, Send, Trash2, X } from 'lucide-react';
import {
  createDiscussion,
  createDiscussionComment,
  deleteDiscussion,
  getDiscussionById,
  getDiscussions,
  uploadImage,
  type DiscussionPostDto,
  type UploadedImage,
} from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { Toasts, useToasts } from '../components/Toasts';

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

const getDiscussionBody = (value: string) => {
  const imageUrls = Array.from(value.matchAll(/!\[Ảnh đính kèm\]\((https?:\/\/[^\s)]+)\)/gi)).map(m => m[1]);
  return {
    text: value.replace(/!\[Ảnh đính kèm\]\((https?:\/\/[^\s)]+)\)/gi, '').trim(),
    imageUrls: imageUrls,
  };
};

function PostImageGrid({ images, onImageClick }: { images: string[], onImageClick: (index: number) => void }) {
  const count = images.length;
  if (count === 0) return null;

  const renderImage = (index: number, extraClass = '') => (
    <div key={index} className={`relative cursor-pointer overflow-hidden group ${extraClass}`} onClick={() => onImageClick(index)}>
      <img src={images[index]} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      {index === 4 && count > 5 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-3xl font-bold">+{count - 4}</span>
        </div>
      )}
    </div>
  );

  if (count === 1) {
    return <div className="mt-4 rounded-xl overflow-hidden border border-[#e0e1dc]">{renderImage(0, 'max-h-[500px] aspect-auto')}</div>;
  }
  
  if (count === 2) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-[#e0e1dc] h-64 sm:h-80">
        {renderImage(0)}
        {renderImage(1)}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden border border-[#e0e1dc] h-64 sm:h-96">
        {renderImage(0, 'row-span-2')}
        {renderImage(1)}
        {renderImage(2)}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden border border-[#e0e1dc] h-64 sm:h-96">
        {renderImage(0)}
        {renderImage(1)}
        {renderImage(2)}
        {renderImage(3)}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-6 grid-rows-2 gap-1 rounded-xl overflow-hidden border border-[#e0e1dc] h-72 sm:h-96">
      {renderImage(0, 'col-span-3 row-span-1')}
      {renderImage(1, 'col-span-3 row-span-1')}
      {renderImage(2, 'col-span-2 row-span-1')}
      {renderImage(3, 'col-span-2 row-span-1')}
      {renderImage(4, 'col-span-2 row-span-1')}
    </div>
  );
}

function PhotoViewerModal({
  post,
  initialIndex,
  onClose,
  commentInputs,
  setCommentInputs,
  handleComment,
  commentingId,
  requireLogin
}: {
  post: DiscussionPostDto;
  initialIndex: number;
  onClose: () => void;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleComment: (postId: string) => Promise<void>;
  commentingId: string | null;
  requireLogin: () => boolean;
}) {
  const postBody = getDiscussionBody(post.content);
  const images = postBody.imageUrls;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1));
  };
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0));
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, images.length]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-black/95 md:bg-black backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-4 left-4 z-[210] p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition" aria-label="Đóng">
        <X size={24} />
      </button>

      <div className="flex-1 relative flex items-center justify-center min-h-[50vh] md:min-h-screen">
        <img src={images[currentIndex]} alt="View" className="max-w-full max-h-full object-contain" />
        
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition" aria-label="Ảnh trước">
              <ChevronLeft size={28} />
            </button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition" aria-label="Ảnh tiếp theo">
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      <div className="w-full md:w-[360px] lg:w-[400px] bg-white h-[50vh] md:h-screen flex flex-col shrink-0 rounded-t-2xl md:rounded-none overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8edda] text-xs font-bold text-[#56642b]">
              {initials(post.authorName)}
            </div>
            <div>
              <p className="text-sm font-bold">{post.authorName || 'Thành viên'}</p>
              <time className="text-xs text-[#747878]">{formatDate(post.createdAt)}</time>
            </div>
          </div>
          
          <h2 className="font-serif text-lg font-bold">{post.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#434748]">{postBody.text}</p>
          
          <div className="my-5 flex items-center gap-2 border-y border-[#eeeeea] py-3 text-xs text-[#666b69]">
            <MessageSquare size={16} />
            <span>{post.commentCount ?? post.comments?.length ?? 0} bình luận</span>
          </div>

          <div className="space-y-4 pb-4">
            {(post.comments ?? []).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f1ec] text-[10px] font-bold text-[#56642b]">
                  {initials(comment.authorName)}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-[#f0f2f5] px-3.5 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-xs">{comment.authorName || 'Thành viên'}</strong>
                    <time className="text-[10px] text-[#747878]">{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#434748]">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#eeeeea] bg-white">
          <div className="flex items-center gap-2 rounded-full border border-[#dfe1dc] bg-[#f0f2f5] px-4 py-2">
            <input
              value={commentInputs[post.id] ?? ''}
              onChange={(event) => setCommentInputs((current) => ({ ...current, [post.id]: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleComment(post.id);
                }
              }}
              onFocus={() => requireLogin()}
              className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
              placeholder="Viết bình luận..."
            />
            <button
              type="button"
              disabled={commentingId === post.id || !commentInputs[post.id]?.trim()}
              onClick={() => void handleComment(post.id)}
              className="text-[#56642b] disabled:opacity-40 transition-opacity"
              aria-label="Gửi bình luận"
            >
              {commentingId === post.id ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Discussion() {
  const [posts, setPosts] = useState<DiscussionPostDto[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachedImages, setAttachedImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<{ postId: string; startIndex: number } | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [targetPostId, setTargetPostId] = useState(() => new URLSearchParams(window.location.search).get('postId') ?? '');
  const [targetCommentId, setTargetCommentId] = useState(() => new URLSearchParams(window.location.search).get('commentId') ?? '');
  const { toasts, addToast, removeToast } = useToasts();

  const loadPosts = useCallback(async (term = '', linkedPostId = targetPostId) => {
    setLoading(true);
    try {
      const result = await getDiscussions({ pageNumber: 1, pageSize: 50, searchTerm: term || undefined });
      const items = result.items ?? [];
      let hydratedItems = await Promise.all(items.map(async (post) => {
        const listedComments = Array.isArray(post.comments) ? post.comments : [];
        const expectedCommentCount = post.commentCount ?? listedComments.length;

        if (listedComments.length >= expectedCommentCount) {
          return { ...post, comments: listedComments };
        }

        try {
          const detail = await getDiscussionById(post.id);
          return {
            ...post,
            ...detail,
            comments: Array.isArray(detail.comments) ? detail.comments : listedComments,
          };
        } catch {
          return { ...post, comments: listedComments };
        }
      }));
      if (linkedPostId && !hydratedItems.some((post) => post.id === linkedPostId)) {
        try {
          const targetPost = await getDiscussionById(linkedPostId);
          hydratedItems = [targetPost, ...hydratedItems];
        } catch {
          // Keep the regular discussion list if the linked post is no longer available.
        }
      }
      setPosts(hydratedItems);
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách thảo luận.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, targetPostId]);

  const handleDeletePost = async (id: string) => {
    if (!requireLogin()) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thảo luận này?')) return;
    try {
      await deleteDiscussion(id);
      addToast('Đã xóa bài thảo luận thành công.', 'success');
      void loadPosts(searchTerm);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa bài thảo luận.', 'error');
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(
      () => void loadPosts(new URLSearchParams(window.location.search).get('q') ?? ''),
      0,
    );
    return () => window.clearTimeout(loadTimer);
  }, [loadPosts]);

  useEffect(() => {
    if (loading || !targetPostId) return;
    const scrollTimer = window.setTimeout(() => {
      const target = (targetCommentId && document.getElementById(`discussion-comment-${targetCommentId}`))
        || document.getElementById(`discussion-post-${targetPostId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => window.clearTimeout(scrollTimer);
  }, [loading, posts, targetCommentId, targetPostId]);

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
      addToast('Vui lòng nhập đầy đủ tiêu đề và nội dung.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const imagesMarkdown = attachedImages.length > 0
        ? `\n\n` + attachedImages.map((img) => `![Ảnh đính kèm](${img.url})`).join('\n')
        : '';
      const discussionContent = `${content.trim()}${imagesMarkdown}`;
      const id = await createDiscussion({ title: title.trim(), content: discussionContent });
      const created = await getDiscussionById(id);
      setPosts((current) => [created, ...current.filter((post) => post.id !== id)]);
      setTitle('');
      setContent('');
      setAttachedImages([]);
      addToast('Đăng bài thảo luận thành công.', 'success');
    } catch (submitError) {
      addToast(submitError instanceof Error ? submitError.message : 'Không thể đăng bài thảo luận.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    if (!requireLogin()) return;
    
    if (attachedImages.length + files.length > 5) {
      addToast('Chỉ được chọn tối đa 5 ảnh cho mỗi bài thảo luận.', 'error');
      return;
    }
    
    const invalidFile = files.find(f => !f.type.startsWith('image/') || f.size > 10 * 1024 * 1024);
    if (invalidFile) {
      addToast('Vui lòng chọn đúng định dạng ảnh và mỗi ảnh không vượt quá 10 MB.', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const uploads = await Promise.all(files.map((file) => uploadImage(file)));
      setAttachedImages((current) => [...current, ...uploads]);
      addToast(`Tải thành công ${uploads.length} ảnh lên.`, 'success');
    } catch (uploadError) {
      addToast(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleComment = async (postId: string) => {
    if (!requireLogin()) return;
    const comment = commentInputs[postId]?.trim();
    if (!comment || commentingId) return;
    setCommentingId(postId);
    try {
      await createDiscussionComment(postId, comment);
      const refreshed = await getDiscussionById(postId);
      setPosts((current) => current.map((post) => post.id === postId ? refreshed : post));
      setCommentInputs((current) => ({ ...current, [postId]: '' }));
      addToast('Đã gửi bình luận.', 'success');
    } catch (commentError) {
      addToast(commentError instanceof Error ? commentError.message : 'Không thể gửi bình luận.', 'error');
    } finally {
      setCommentingId(null);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedTerm = searchTerm.trim();
    const searchParams = new URLSearchParams();
    if (normalizedTerm) searchParams.set('q', normalizedTerm);
    window.history.replaceState(null, '', `/discussion${searchParams.size ? `?${searchParams.toString()}` : ''}`);
    setTargetPostId('');
    setTargetCommentId('');
    void loadPosts(normalizedTerm, '');
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
                  {attachedImages.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {attachedImages.map((img, index) => (
                        <div key={img.url || index} className="flex items-center gap-3 rounded-md border border-[#dfe1dc] bg-white p-2">
                          <img
                            src={img.url}
                            alt="Ảnh đính kèm"
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1a1c1b]">{img.fileName || `Ảnh ${index + 1}`}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAttachedImages((curr) => curr.filter((_, i) => i !== index))}
                            disabled={submitting || uploadingImage}
                            className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                            aria-label="Gỡ ảnh"
                            title="Gỡ ảnh"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className={`flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-[#56642b] transition-colors ${uploadingImage ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-[#edf1e2]'}`}>
                    {uploadingImage ? <LoaderCircle size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                    {uploadingImage ? 'Đang tải ảnh lên...' : attachedImages.length > 0 ? 'Thêm ảnh khác' : 'Thêm ảnh từ máy tính'}
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingImage || submitting}
                      onChange={(event) => void handleImageUpload(event)}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] text-[#747878]">Hỗ trợ JPG, PNG, WEBP hoặc GIF, tối đa 10 MB/ảnh và tối đa 5 ảnh/bài.</p>
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
              <article
                key={post.id}
                id={`discussion-post-${post.id}`}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow ${targetPostId === post.id ? 'border-[#899073] ring-2 ring-[#899073]/25' : 'border-[#e0e1dc]'}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8edda] text-xs font-bold text-[#56642b]">{initials(post.authorName)}</div>
                    <div>
                      <p className="text-sm font-bold">{post.authorName || 'Thành viên'}</p>
                      <time className="text-xs text-[#747878]">{formatDate(post.createdAt)}</time>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === post.id ? null : post.id)}
                      className="rounded-full p-2 text-[#747878] transition-colors hover:bg-[#f0f1ec]"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {activeDropdownId === post.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)}></div>
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#e0e1dc] bg-white py-1 shadow-lg">
                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              void handleDeletePost(post.id);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-[#f9f9f9]"
                          >
                            <Trash2 size={16} />
                            <span>Xóa bài viết</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <h2 className="font-serif text-xl font-bold">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#434748]">{postBody.text}</p>
                {postBody.imageUrls && postBody.imageUrls.length > 0 && (
                  <PostImageGrid 
                    images={postBody.imageUrls} 
                    onImageClick={(index) => setViewerState({ postId: post.id, startIndex: index })} 
                  />
                )}
                <div className="my-5 flex items-center gap-2 border-y border-[#eeeeea] py-3 text-xs text-[#666b69]">
                  <MessageSquare size={16} />
                  <span>{post.commentCount ?? post.comments?.length ?? 0} bình luận</span>
                </div>

                <div className="space-y-3">
                  {(post.comments ?? []).map((comment) => (
                    <div
                      key={comment.id}
                      id={`discussion-comment-${comment.id}`}
                      className={`flex gap-3 rounded-lg transition-colors ${targetCommentId === comment.id ? 'bg-[#eef2e3] p-2' : ''}`}
                    >
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
            <button onClick={() => void loadPosts(searchTerm.trim(), '')} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#56642b] px-4 py-2.5 text-sm font-semibold text-[#56642b] disabled:opacity-50">
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

      {(() => {
        const activeViewerPost = viewerState ? posts.find(p => p.id === viewerState.postId) : null;
        if (!activeViewerPost || !viewerState) return null;
        return (
          <PhotoViewerModal
            post={activeViewerPost}
            initialIndex={viewerState.startIndex}
            onClose={() => setViewerState(null)}
            commentInputs={commentInputs}
            setCommentInputs={setCommentInputs}
            handleComment={handleComment}
            commentingId={commentingId}
            requireLogin={requireLogin}
          />
        );
      })()}

      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
