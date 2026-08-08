import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteDiscussion,
  getDiscussionById,
  getDiscussions,
  updateDiscussion,
  type DiscussionPostDto,
} from '../services/api';
import AdminPagination from './AdminPagination';
import { useConfirmDialog } from './ConfirmDialog';

interface AdminDiscussionManagerProps {
  searchQuery: string;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TV';
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? ''}`.toUpperCase();
};

const getPlainExcerpt = (content: string) =>
  content
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function AdminDiscussionManager({
  searchQuery,
  notify,
}: AdminDiscussionManagerProps) {
  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog();
  const pageSize = 10;
  const [posts, setPosts] = useState<DiscussionPostDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<DiscussionPostDto | null>(null);
  const [editingPost, setEditingPost] = useState<DiscussionPostDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDiscussions({ pageNumber: 1, pageSize: 100 });
      setPosts(result.items ?? []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể tải danh sách thảo luận.', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi');
    if (!keyword) return posts;
    return posts.filter((post) =>
      [post.title, post.content, post.authorName, post.id].some((value) =>
        value?.toLocaleLowerCase('vi').includes(keyword),
      ),
    );
  }, [posts, searchQuery]);

  const pagedPosts = useMemo(
    () => filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredPosts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, filteredPosts.length]);

  const openDetails = async (post: DiscussionPostDto) => {
    try {
      setSelectedPost(await getDiscussionById(post.id));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể tải nội dung thảo luận.', 'error');
    }
  };

  const openEdit = async (post: DiscussionPostDto) => {
    try {
      const detail = await getDiscussionById(post.id);
      setEditingPost(detail);
      setEditTitle(detail.title);
      setEditContent(detail.content);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể tải bài để chỉnh sửa.', 'error');
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    if (!editTitle.trim() || !editContent.trim()) {
      notify('Vui lòng nhập đầy đủ tiêu đề và nội dung.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateDiscussion(editingPost.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === editingPost.id
            ? { ...post, title: editTitle.trim(), content: editContent.trim() }
            : post,
        ),
      );
      setEditingPost(null);
      notify('Đã cập nhật bài thảo luận.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể cập nhật bài thảo luận.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: DiscussionPostDto) => {
    if (!(await confirmDelete({
      title: 'Xóa bài thảo luận?',
      message: 'Bài viết cùng nội dung thảo luận liên quan sẽ bị xóa và không thể khôi phục.',
      itemName: post.title,
      confirmLabel: 'Xóa bài viết',
    }))) return;
    setDeletingId(post.id);
    try {
      await deleteDiscussion(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (selectedPost?.id === post.id) setSelectedPost(null);
      if (editingPost?.id === post.id) setEditingPost(null);
      notify('Đã xóa bài thảo luận.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể xóa bài thảo luận.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71803c]">Kiểm soát nội dung cộng đồng</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-on-surface">Quản lý thảo luận</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Admin có thể xem, chỉnh sửa và xóa bài đã đăng. Trang quản trị không có chức năng tạo bài mới.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPosts()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#56642b] transition-colors hover:bg-[#eef1e2] disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-outline-variant/50 pb-3 text-xs text-outline">
        <span>Đang hiển thị {filteredPosts.length} bài thảo luận</span>
        {searchQuery.trim() && (
          <span className="inline-flex items-center gap-1 rounded bg-[#eef1e2] px-2 py-1 font-semibold text-[#56642b]">
            <Search className="h-3 w-3" /> Đã lọc
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center text-sm text-outline">
          Đang tải danh sách thảo luận...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
          <MessageSquare className="mx-auto h-9 w-9 text-[#87905f]" />
          <p className="mt-3 font-serif text-xl font-bold">Chưa có bài thảo luận phù hợp</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-outline-variant bg-[#f4f4f2] text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">Bài thảo luận</th>
                  <th className="px-5 py-3">Người đăng</th>
                  <th className="px-5 py-3">Ngày đăng</th>
                  <th className="px-5 py-3 text-center">Tương tác</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {pagedPosts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-[#fafbf6]">
                    <td className="max-w-md px-5 py-4">
                      <p className="truncate text-sm font-bold text-on-surface">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-outline">
                        {getPlainExcerpt(post.content) || 'Bài viết không có nội dung mô tả.'}
                      </p>
                      <p className="mt-1 truncate font-mono text-[9px] text-outline/70">ID: {post.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {post.authorAvatarUrl ? (
                          <img
                            src={post.authorAvatarUrl}
                            alt={post.authorName}
                            className="h-9 w-9 rounded-full border border-outline-variant object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef1e2] font-bold text-[#56642b]">
                            {getInitials(post.authorName)}
                          </span>
                        )}
                        <span className="max-w-40 truncate font-semibold text-on-surface">{post.authorName || 'Người dùng'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-outline">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateTime(post.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-4 text-outline">
                        <span className="inline-flex items-center gap-1" title="Lượt thích"><Heart className="h-3.5 w-3.5" /> {post.likeCount}</span>
                        <span className="inline-flex items-center gap-1" title="Bình luận"><MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => void openDetails(post)} className="rounded-md p-2 text-outline transition-colors hover:bg-[#eef1e2] hover:text-[#56642b]" title="Xem bài"><Eye className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void openEdit(post)} className="rounded-md p-2 text-outline transition-colors hover:bg-[#eef1e2] hover:text-[#56642b]" title="Chỉnh sửa bài"><Edit className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void handleDelete(post)} disabled={deletingId === post.id} className="rounded-md p-2 text-outline transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-40" title="Xóa bài"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminPagination
        currentPage={currentPage}
        totalItems={filteredPosts.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="bài thảo luận"
      />

      {selectedPost && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Chi tiết bài thảo luận">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-outline-variant bg-white px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#71803c]">Chi tiết thảo luận</p>
                <h3 className="mt-1 font-serif text-2xl font-bold">{selectedPost.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedPost(null)} className="rounded-full p-2 text-outline hover:bg-[#f1f1ed]" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-outline">
                <span className="font-semibold text-on-surface">{selectedPost.authorName}</span>
                <span>{formatDateTime(selectedPost.createdAt)}</span>
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-outline-variant/60 bg-[#fafbf6] p-5 text-sm leading-7 text-on-surface">
                {selectedPost.content}
              </div>
              <div>
                <h4 className="font-bold">Bình luận ({selectedPost.comments?.length ?? 0})</h4>
                <div className="mt-3 space-y-3">
                  {(selectedPost.comments ?? []).map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-outline-variant/50 p-4">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold">{comment.authorName}</span>
                        <span className="text-outline">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface-variant">{comment.content}</p>
                    </div>
                  ))}
                  {!selectedPost.comments?.length && <p className="text-sm text-outline">Bài viết chưa có bình luận.</p>}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-outline-variant bg-white px-6 py-4">
              <button type="button" onClick={() => { setSelectedPost(null); void openEdit(selectedPost); }} className="inline-flex items-center gap-2 rounded border border-[#56642b] px-4 py-2 text-xs font-bold uppercase text-[#56642b] hover:bg-[#eef1e2]"><Edit className="h-3.5 w-3.5" /> Chỉnh sửa</button>
              <button type="button" onClick={() => void handleDelete(selectedPost)} className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-red-700"><Trash2 className="h-3.5 w-3.5" /> Xóa bài</button>
            </div>
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Chỉnh sửa bài thảo luận">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#71803c]">Quản trị nội dung</p>
                <h3 className="mt-1 font-serif text-2xl font-bold">Chỉnh sửa bài thảo luận</h3>
              </div>
              <button type="button" onClick={() => setEditingPost(null)} className="rounded-full p-2 text-outline hover:bg-[#f1f1ed]" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-outline">Tiêu đề *</span>
                <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="w-full rounded-md border border-outline-variant bg-[#f9f9f7] px-4 py-3 text-sm outline-none focus:border-[#56642b] focus:ring-1 focus:ring-[#56642b]" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-outline">Nội dung *</span>
                <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={10} className="w-full resize-y rounded-md border border-outline-variant bg-[#f9f9f7] px-4 py-3 text-sm leading-6 outline-none focus:border-[#56642b] focus:ring-1 focus:ring-[#56642b]" />
              </label>
              <p className="text-xs text-outline">Admin chỉ chỉnh sửa bài đã có; không thể tạo bài mới từ trang này.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-outline-variant bg-[#fafafa] px-6 py-4">
              <button type="button" onClick={() => setEditingPost(null)} disabled={saving} className="rounded border border-outline-variant bg-white px-4 py-2 text-xs font-bold uppercase text-on-surface hover:bg-[#f1f1ed]">Hủy</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded bg-[#56642b] px-5 py-2 text-xs font-bold uppercase text-white hover:bg-[#44501f] disabled:cursor-wait disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
