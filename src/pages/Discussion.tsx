import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit, Heart, ImagePlus, LoaderCircle, LockKeyhole, MessageSquare, MoreHorizontal, RefreshCw, Search, Send, Trash2, X } from 'lucide-react';
import {
  createDiscussion,
  createDiscussionComment,
  deleteDiscussion,
  getDiscussionById,
  getDiscussions,
  getUserById,
  likeDiscussionComment,
  likeDiscussionPost,
  unlikeDiscussionComment,
  unlikeDiscussionPost,
  updateDiscussion,
  uploadImage,
  type DiscussionPostDto,
  type UploadedImage,
  type UserListItem,
} from '../services/api';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { Toasts, useToasts } from '../components/Toasts';
import { useConfirmDialog } from '../components/ConfirmDialog';

const LOGIN_URL = `/login?returnUrl=${encodeURIComponent('/discussion')}`;
const RECENT_COMMENT_LIMIT = 3;

const hasApiErrorMessage = (error: unknown, message: string) =>
  error instanceof Error
  && error.message.toLocaleLowerCase('vi').includes(message.toLocaleLowerCase('vi'));

const hasAuthToken = () => Boolean(
  localStorage.getItem('orchidee_auth_token')
  || sessionStorage.getItem('orchidee_auth_token'),
);

const readStoredUserProfile = (): UserListItem | null => {
  const raw = localStorage.getItem('orchidee_user') || sessionStorage.getItem('orchidee_user');
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as UserListItem;
    return profile && (profile.id || profile.email) ? profile : null;
  } catch {
    return null;
  }
};

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(-2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

function AuthorAvatar({ name, avatarUrl, className }: { name: string; avatarUrl?: string; className: string }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-[#e8edda] font-bold text-[#56642b] ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`Ảnh đại diện của ${name || 'thành viên'}`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{initials(name)}</span>
      )}
    </div>
  );
}

const isAdminProfile = (profile?: UserListItem) => {
  const role = profile?.roleName?.replace(/[\s_-]+/g, '').toLocaleLowerCase('vi') || '';
  return ['admin', 'administrator', 'systemadmin', 'superadmin'].includes(role);
};

function AdminBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-[#eee8ff] px-2 py-0.5 text-[10px] font-semibold text-[#7151c9]">
      Admin
    </span>
  );
}

function PostLikeButton({
  liked,
  count,
  loading,
  onClick,
}: {
  liked: boolean;
  count: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? 'Bỏ thích bài viết' : 'Thích bài viết'}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-2 font-semibold transition-all disabled:cursor-wait disabled:opacity-60 ${
        liked
          ? 'border-[#65752e]/30 bg-[#eef2e3] text-[#56642b]'
          : 'border-transparent text-[#666b69] hover:border-[#d8ddca] hover:bg-[#f4f6ed] hover:text-[#56642b]'
      }`}
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : (
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      )}
      <span>{liked ? 'Đã thích' : 'Thích'}</span>
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${liked ? 'bg-white/80' : 'bg-[#eef0e9]'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function CommentLikeButton({
  liked,
  count,
  loading,
  onClick,
}: {
  liked: boolean;
  count: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
      {count > 0 && (
        <span className="text-xs text-[#747878]">
          {count} lượt thích
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-pressed={liked}
        aria-label={liked ? 'Bỏ thích bình luận' : 'Thích bình luận'}
        className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${
          liked
            ? 'border-[#65752e]/40 bg-[#f4f6ed] text-[#65752e]'
            : 'border-[#cfd2cb] text-[#747878] hover:border-[#899073] hover:text-[#56642b]'
        }`}
      >
        {loading ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        )}
        <span>{liked ? 'Đã thích' : 'Thích'}</span>
      </button>
    </div>
  );
}

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

const sortCommentsNewestFirst = (comments: DiscussionPostDto['comments'] = []) => [...comments].sort((left, right) => {
  const rightTime = new Date(right.createdAt).getTime();
  const leftTime = new Date(left.createdAt).getTime();
  return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
});

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
  handlePostLike,
  handleCommentLike,
  likingPostIds,
  likingCommentIds,
  requireLogin,
  authorProfiles,
}: {
  post: DiscussionPostDto;
  initialIndex: number;
  onClose: () => void;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleComment: (postId: string) => Promise<void>;
  commentingId: string | null;
  handlePostLike: (postId: string) => Promise<void>;
  handleCommentLike: (postId: string, commentId: string) => Promise<void>;
  likingPostIds: Set<string>;
  likingCommentIds: Set<string>;
  requireLogin: () => boolean;
  authorProfiles: Record<string, UserListItem>;
}) {
  const postBody = getDiscussionBody(post.content);
  const [showAllComments, setShowAllComments] = useState(false);
  const sortedComments = sortCommentsNewestFirst(post.comments);
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(0, RECENT_COMMENT_LIMIT);
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
            <AuthorAvatar
              name={post.authorName}
              avatarUrl={post.authorAvatarUrl || authorProfiles[post.authorId]?.avatarUrl}
              className="h-10 w-10 text-xs"
            />
            <div>
              <p className="text-sm font-bold">{post.authorName || 'Thành viên'}</p>
              <time className="text-xs text-[#747878]">{formatDate(post.createdAt)}</time>
            </div>
          </div>
          
          <h2 className="font-serif text-lg font-bold">{post.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#434748]">{postBody.text}</p>
          
          <div className="my-5 flex items-center gap-4 border-y border-[#eeeeea] py-3 text-xs text-[#666b69]">
            <PostLikeButton
              liked={post.isLikedByCurrentUser}
              count={post.likeCount || 0}
              loading={likingPostIds.has(post.id)}
              onClick={() => void handlePostLike(post.id)}
            />
            <span className="h-4 w-px bg-[#dedfd9]" />
            <span className="flex items-center gap-1.5">
              <MessageSquare size={16} />
              {post.commentCount ?? post.comments?.length ?? 0} bình luận
            </span>
          </div>

          <div className="space-y-4 pb-4">
            {visibleComments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-2.5 rounded-2xl border border-[#e5e6e1] bg-white p-3 shadow-[0_4px_12px_rgba(32,36,34,0.07)]"
              >
                <AuthorAvatar
                  name={comment.authorName}
                  avatarUrl={comment.authorAvatarUrl || authorProfiles[comment.authorId]?.avatarUrl}
                  className="h-9 w-9 bg-[#f0f1ec] text-[10px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <strong className="truncate text-sm">{comment.authorName || 'Thành viên'}</strong>
                      {(comment.isSystemAdmin || isAdminProfile(authorProfiles[comment.authorId])) && <AdminBadge />}
                    </div>
                    <time className="text-xs text-[#747878]">{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-[#303433]">{comment.content}</p>
                  <CommentLikeButton
                    liked={comment.isLikedByCurrentUser}
                    count={comment.likeCount || 0}
                    loading={likingCommentIds.has(comment.id)}
                    onClick={() => void handleCommentLike(post.id, comment.id)}
                  />
                </div>
              </div>
            ))}
            {sortedComments.length > RECENT_COMMENT_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllComments((current) => !current)}
                className="w-full py-2 text-center text-xs font-semibold text-[#56642b] hover:underline"
              >
                {showAllComments ? 'Thu gọn bình luận' : `Hiển thị toàn bộ ${sortedComments.length} bình luận`}
              </button>
            )}
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

interface DiscussionProps {
  isAdmin?: boolean;
}

export default function Discussion({ isAdmin = false }: DiscussionProps) {
  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog();
  const [posts, setPosts] = useState<DiscussionPostDto[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachedImages, setAttachedImages] = useState<UploadedImage[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set());
  const [viewerState, setViewerState] = useState<{ postId: string; startIndex: number } | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<Set<string>>(new Set());
  const [targetPostId, setTargetPostId] = useState(() => new URLSearchParams(window.location.search).get('postId') ?? '');
  const [targetCommentId, setTargetCommentId] = useState(() => new URLSearchParams(window.location.search).get('commentId') ?? '');
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, UserListItem>>({});
  const [editingPost, setEditingPost] = useState<DiscussionPostDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageMarkdown, setEditImageMarkdown] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  const loadAuthorProfiles = useCallback(async (discussionPosts: DiscussionPostDto[]) => {
    if (!hasAuthToken()) return;
    const sessionProfile = readStoredUserProfile();
    if (sessionProfile) {
      setAuthorProfiles((current) => {
        const next = { ...current };
        discussionPosts.forEach((post) => {
          const postMatchesSession = post.authorId === sessionProfile.id
            || post.authorName.trim().toLocaleLowerCase('vi') === sessionProfile.fullName.trim().toLocaleLowerCase('vi');
          if (postMatchesSession) next[post.authorId] = sessionProfile;
          (post.comments ?? []).forEach((comment) => {
            const commentMatchesSession = comment.authorId === sessionProfile.id
              || comment.authorName.trim().toLocaleLowerCase('vi') === sessionProfile.fullName.trim().toLocaleLowerCase('vi');
            if (commentMatchesSession) next[comment.authorId] = sessionProfile;
          });
        });
        return next;
      });
    }
    const authorIds = Array.from(new Set(
      discussionPosts.flatMap((post) => [
        post.authorId,
        ...(Array.isArray(post.comments) ? post.comments.map((comment) => comment.authorId) : []),
      ]).filter(Boolean),
    ));
    if (authorIds.length === 0) return;

    const results = await Promise.all(authorIds
      .filter((authorId) => authorId !== sessionProfile?.id)
      .map(async (authorId) => {
      try {
        return await getUserById(authorId);
      } catch {
        return null;
      }
    }));
    setAuthorProfiles((current) => {
      const next = { ...current };
      results.forEach((profile) => {
        if (profile?.id) next[profile.id] = profile;
      });
      return next;
    });
  }, []);

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
      void loadAuthorProfiles(hydratedItems);
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách thảo luận.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, loadAuthorProfiles, targetPostId]);

  const handleDeletePost = async (id: string) => {
    if (!requireLogin()) return;
    const post = posts.find((item) => item.id === id);
    if (!(await confirmDelete({
      title: 'Xóa bài thảo luận?',
      message: 'Bài viết cùng nội dung thảo luận liên quan sẽ bị gỡ khỏi cộng đồng.',
      itemName: post?.title,
      confirmLabel: 'Xóa bài viết',
    }))) return;
    try {
      await deleteDiscussion(id);
      addToast('Đã xóa bài thảo luận thành công.', 'success');
      void loadPosts(searchTerm);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa bài thảo luận.', 'error');
    }
  };

  const openEditPost = (post: DiscussionPostDto) => {
    const body = getDiscussionBody(post.content);
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(body.text);
    setEditImageMarkdown((body.imageUrls ?? []).map((url) => `![Ảnh đính kèm](${url})`).join('\n'));
    setActiveDropdownId(null);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPost || !editTitle.trim() || !editContent.trim()) {
      addToast('Vui lòng nhập đầy đủ tiêu đề và nội dung.', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const nextContent = `${editContent.trim()}${editImageMarkdown ? `\n\n${editImageMarkdown}` : ''}`;
      await updateDiscussion(editingPost.id, { title: editTitle.trim(), content: nextContent });
      const refreshed = await getDiscussionById(editingPost.id);
      setPosts((current) => current.map((post) => post.id === refreshed.id ? refreshed : post));
      setEditingPost(null);
      addToast('Đã cập nhật bài thảo luận.', 'success');
    } catch (saveError) {
      addToast(saveError instanceof Error ? saveError.message : 'Không thể cập nhật bài thảo luận.', 'error');
    } finally {
      setSavingEdit(false);
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
    const refreshAvatars = () => void loadAuthorProfiles(posts);
    window.addEventListener('orchidee-profile-updated', refreshAvatars);
    return () => window.removeEventListener('orchidee-profile-updated', refreshAvatars);
  }, [loadAuthorProfiles, posts]);

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

  const openComposer = () => {
    if (!requireLogin()) return;
    setIsComposerOpen(true);
  };

  const handlePostLike = async (postId: string) => {
    if (!requireLogin() || likingPostIds.has(postId)) return;
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextLikedState = !post.isLikedByCurrentUser;
    setLikingPostIds((current) => new Set(current).add(postId));
    try {
      const result = post.isLikedByCurrentUser
        ? await unlikeDiscussionPost(postId)
        : await likeDiscussionPost(postId);
      setPosts((current) => current.map((item) => item.id === postId
        ? {
            ...item,
            likeCount: result.likeCount,
            isLikedByCurrentUser: nextLikedState,
          }
        : item));
    } catch (likeError) {
      if (nextLikedState && hasApiErrorMessage(likeError, 'Dữ liệu đã tồn tại')) {
        setPosts((current) => current.map((item) => item.id === postId
          ? {
              ...item,
              likeCount: Math.max(1, item.likeCount || 0),
              isLikedByCurrentUser: true,
            }
          : item));
      } else {
        addToast(likeError instanceof Error ? likeError.message : 'Không thể cập nhật lượt thích.', 'error');
      }
    } finally {
      setLikingPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    if (!requireLogin() || likingCommentIds.has(commentId)) return;
    const comment = posts
      .find((item) => item.id === postId)
      ?.comments.find((item) => item.id === commentId);
    if (!comment) return;

    const nextLikedState = !comment.isLikedByCurrentUser;
    setLikingCommentIds((current) => new Set(current).add(commentId));
    try {
      const result = comment.isLikedByCurrentUser
        ? await unlikeDiscussionComment(postId, commentId)
        : await likeDiscussionComment(postId, commentId);
      setPosts((current) => current.map((post) => post.id === postId
        ? {
            ...post,
            comments: post.comments.map((item) => item.id === commentId
              ? {
                  ...item,
                  likeCount: result.likeCount,
                  isLikedByCurrentUser: nextLikedState,
                }
              : item),
          }
        : post));
    } catch (likeError) {
      if (nextLikedState && hasApiErrorMessage(likeError, 'Dữ liệu đã tồn tại')) {
        setPosts((current) => current.map((postItem) => postItem.id === postId
          ? {
              ...postItem,
              comments: postItem.comments.map((item) => item.id === commentId
                ? {
                    ...item,
                    likeCount: Math.max(1, item.likeCount || 0),
                    isLikedByCurrentUser: true,
                  }
                : item),
            }
          : postItem));
      } else {
        addToast(likeError instanceof Error ? likeError.message : 'Không thể cập nhật lượt thích bình luận.', 'error');
      }
    } finally {
      setLikingCommentIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
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
      void loadAuthorProfiles([created]);
      setTitle('');
      setContent('');
      setAttachedImages([]);
      setIsComposerOpen(false);
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
      void loadAuthorProfiles([refreshed]);
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

  const cancelComposer = () => {
    setTitle('');
    setContent('');
    setAttachedImages([]);
    setIsComposerOpen(false);
  };

  const composerProfile = readStoredUserProfile();
  const composerFirstName = composerProfile?.fullName?.trim().split(/\s+/).pop() || 'Bạn';
  const currentUserIsAdmin = isAdmin;

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-[#1a1c1b]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium tracking-wider text-[#747878]">
          <a href="/" className="flex items-center gap-1 transition-colors hover:text-botanical-green"><ArrowLeft size={14} /> Trang chủ</a>
          <span>&gt;</span>
          <span className="font-semibold text-[#1a1c1b]">Thảo luận</span>
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

        {currentUserIsAdmin && (
          <div className="mb-6 rounded-xl border border-[#87905f]/35 bg-[#f1f4e7] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#667234]">Chế độ quản trị</p>
            <p className="mt-1 text-sm text-[#4f554e]">Admin có thể tạo bài bằng khung đăng bài, đồng thời sửa hoặc xóa mọi bài trong menu tùy chọn.</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-5">
            {!isComposerOpen ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#e0e1dc] bg-white p-3 shadow-sm">
                <AuthorAvatar
                  name={composerProfile?.fullName || composerFirstName}
                  avatarUrl={composerProfile?.avatarUrl}
                  className="h-10 w-10 text-xs"
                />
                <button
                  type="button"
                  onClick={openComposer}
                  className="min-w-0 flex-1 rounded-full bg-[#f0f2f3] px-4 py-3 text-left text-sm text-[#747878] transition-colors hover:bg-[#e8ebec]"
                >
                  {composerFirstName} ơi, bạn đang nghĩ gì thế?
                </button>
                <button
                  type="button"
                  onClick={openComposer}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#42a866] transition-colors hover:bg-[#edf7ef]"
                  aria-label="Đăng bài có ảnh"
                  title="Đăng bài có ảnh"
                >
                  <ImagePlus size={23} />
                </button>
              </div>
            ) : (
            <form onSubmit={handleCreatePost} className="rounded-xl border border-[#e0e1dc] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="font-serif text-xl font-bold">Tạo bài thảo luận</h2>
                  <button
                    type="button"
                    onClick={cancelComposer}
                    disabled={submitting || uploadingImage}
                    className="rounded-full p-1.5 text-[#747878] transition-colors hover:bg-[#f0f1ec] hover:text-[#303433] disabled:opacity-50"
                    aria-label="Thu gọn khung đăng bài"
                    title="Thu gọn"
                  >
                    <X size={19} />
                  </button>
                </div>
                <div className="mb-5 flex items-center gap-3 border-b border-[#ecece7] pb-4">
                  <AuthorAvatar
                    name={composerProfile?.fullName || composerFirstName}
                    avatarUrl={composerProfile?.avatarUrl}
                    className="h-11 w-11 text-xs"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1a1c1b]">
                      {composerProfile?.fullName || composerFirstName}
                    </p>
                    <p className="mt-0.5 text-xs text-[#747878]">Đăng trong cộng đồng Hoa Lan</p>
                  </div>
                </div>
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
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelComposer}
                    disabled={submitting || uploadingImage}
                    className="rounded-lg border border-[#cfd2cb] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#56642b] transition-colors hover:bg-[#f4f6ed] disabled:opacity-60"
                  >
                    Hủy
                  </button>
                  <button disabled={submitting || uploadingImage} className="flex items-center gap-2 rounded-lg bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60">
                    {submitting && <LoaderCircle size={15} className="animate-spin" />}
                    {submitting ? 'Đang đăng...' : 'Đăng bài'}
                  </button>
                </div>
            </form>
            )}

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
              const sortedComments = sortCommentsNewestFirst(post.comments);
              const showAllComments = expandedCommentPostIds.has(post.id)
                || (targetPostId === post.id && Boolean(targetCommentId));
              const visibleComments = showAllComments
                ? sortedComments
                : sortedComments.slice(0, RECENT_COMMENT_LIMIT);
              const canManagePost = currentUserIsAdmin || composerProfile?.id === post.authorId;
              return (
              <article
                key={post.id}
                id={`discussion-post-${post.id}`}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow ${targetPostId === post.id ? 'border-[#899073] ring-2 ring-[#899073]/25' : 'border-[#e0e1dc]'}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AuthorAvatar
                      name={post.authorName}
                      avatarUrl={post.authorAvatarUrl || authorProfiles[post.authorId]?.avatarUrl}
                      className="h-10 w-10 text-xs"
                    />
                    <div>
                      <p className="text-sm font-bold">{post.authorName || 'Thành viên'}</p>
                      <time className="text-xs text-[#747878]">{formatDate(post.createdAt)}</time>
                    </div>
                  </div>
                  {canManagePost && <div className="relative">
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
                          {currentUserIsAdmin && (
                            <button
                              type="button"
                              onClick={() => openEditPost(post)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#56642b] hover:bg-[#f9f9f9]"
                            >
                              <Edit size={16} />
                              <span>Chỉnh sửa bài</span>
                            </button>
                          )}
                          {(currentUserIsAdmin || composerProfile?.id === post.authorId) && (
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
                          )}
                        </div>
                      </>
                    )}
                  </div>}
                </div>
                <h2 className="font-serif text-xl font-bold">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#434748]">{postBody.text}</p>
                {postBody.imageUrls && postBody.imageUrls.length > 0 && (
                  <PostImageGrid 
                    images={postBody.imageUrls} 
                    onImageClick={(index) => setViewerState({ postId: post.id, startIndex: index })} 
                  />
                )}
                <div className="my-5 flex items-center gap-4 border-y border-[#eeeeea] py-3 text-xs text-[#666b69]">
                  <PostLikeButton
                    liked={post.isLikedByCurrentUser}
                    count={post.likeCount || 0}
                    loading={likingPostIds.has(post.id)}
                    onClick={() => void handlePostLike(post.id)}
                  />
                  <span className="h-4 w-px bg-[#dedfd9]" />
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={16} />
                    {post.commentCount ?? post.comments?.length ?? 0} bình luận
                  </span>
                </div>

                <div className="space-y-3">
                  {visibleComments.map((comment) => (
                    <div
                      key={comment.id}
                      id={`discussion-comment-${comment.id}`}
                      className={`flex gap-2.5 rounded-2xl border bg-white p-3 shadow-[0_4px_12px_rgba(32,36,34,0.07)] transition-all ${
                        targetCommentId === comment.id
                          ? 'border-[#899073] ring-2 ring-[#899073]/20'
                          : 'border-[#e5e6e1]'
                      }`}
                    >
                      <AuthorAvatar
                        name={comment.authorName}
                        avatarUrl={comment.authorAvatarUrl || authorProfiles[comment.authorId]?.avatarUrl}
                        className="h-9 w-9 bg-[#f0f1ec] text-[10px]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <strong className="truncate text-sm">{comment.authorName || 'Thành viên'}</strong>
                            {(comment.isSystemAdmin || isAdminProfile(authorProfiles[comment.authorId])) && <AdminBadge />}
                          </div>
                          <time className="text-xs text-[#747878]">{formatDate(comment.createdAt)}</time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-[#303433]">{comment.content}</p>
                        <CommentLikeButton
                          liked={comment.isLikedByCurrentUser}
                          count={comment.likeCount || 0}
                          loading={likingCommentIds.has(comment.id)}
                          onClick={() => void handleCommentLike(post.id, comment.id)}
                        />
                      </div>
                    </div>
                  ))}
                  {sortedComments.length > RECENT_COMMENT_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setExpandedCommentPostIds((current) => {
                        const next = new Set(current);
                        if (next.has(post.id)) next.delete(post.id);
                        else next.add(post.id);
                        return next;
                      })}
                      className="w-full py-2 text-center text-xs font-semibold text-[#56642b] hover:underline"
                    >
                      {showAllComments ? 'Thu gọn bình luận' : `Hiển thị toàn bộ ${sortedComments.length} bình luận`}
                    </button>
                  )}
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

      {currentUserIsAdmin && editingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Chỉnh sửa bài thảo luận">
          <form onSubmit={handleSaveEdit} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dedfd9] px-6 py-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71803c]">Quản trị nhanh</p><h2 className="font-serif text-2xl font-bold">Chỉnh sửa bài thảo luận</h2></div>
              <button type="button" onClick={() => setEditingPost(null)} className="rounded-full p-2 text-[#747878] hover:bg-[#f0f1ec]" aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Tiêu đề *</span><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="w-full rounded-md border border-[#cfd2cb] px-4 py-3 text-sm outline-none focus:border-[#56642b]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#666b69]">Nội dung *</span><textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={10} className="w-full resize-y rounded-md border border-[#cfd2cb] px-4 py-3 text-sm leading-6 outline-none focus:border-[#56642b]" /></label>
              {editImageMarkdown && <p className="text-xs text-[#747878]">Các ảnh đính kèm hiện có sẽ được giữ nguyên.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dedfd9] bg-[#fafaf7] px-6 py-4"><button type="button" onClick={() => setEditingPost(null)} disabled={savingEdit} className="rounded-md border border-[#cfd2cb] bg-white px-4 py-2.5 text-xs font-bold uppercase">Hủy</button><button type="submit" disabled={savingEdit} className="inline-flex items-center gap-2 rounded-md bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">{savingEdit && <LoaderCircle size={15} className="animate-spin" />}{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
          </form>
        </div>
      )}
      {confirmDialog}

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
            handlePostLike={handlePostLike}
            handleCommentLike={handleCommentLike}
            likingPostIds={likingPostIds}
            likingCommentIds={likingCommentIds}
            requireLogin={requireLogin}
            authorProfiles={authorProfiles}
          />
        );
      })()}

      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
