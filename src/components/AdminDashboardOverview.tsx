import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  FileText,
  Flower2,
  FolderTree,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { getDashboardOverview, type DashboardOverview } from '../services/api';

interface AdminDashboardOverviewProps {
  displayName: string;
  onAddOrchid: () => void;
  onAddUser: () => void;
  onOpenOrchids: () => void;
  onOpenDocuments: () => void;
  onOpenDiscussions: () => void;
  onOpenListItem: (sectionKey: string, item: unknown) => void;
}

interface MetricItem {
  key: string;
  label: string;
  value: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeKey = (key: string) => key.replace(/[^a-z0-9]/gi, '').toLowerCase();

const LABELS: Record<string, string> = {
  totalorchids: 'Tổng số loài lan',
  orchidcount: 'Tổng số loài lan',
  totalcategories: 'Danh mục hoa lan',
  categorycount: 'Danh mục hoa lan',
  totaldocuments: 'Tài liệu',
  documentcount: 'Tài liệu',
  totalusers: 'Người dùng hệ thống',
  usercount: 'Người dùng hệ thống',
  totalarticles: 'Tổng số bài viết',
  articlecount: 'Tổng số bài viết',
  totalcultivationarticles: 'Bài trồng & chăm sóc',
  cultivationarticlecount: 'Bài trồng & chăm sóc',
  totalapplicationarticles: 'Bài viết ứng dụng',
  applicationarticlecount: 'Bài viết ứng dụng',
  totaldiscussions: 'Bài thảo luận',
  discussioncount: 'Bài thảo luận',
  pendingdiscussions: 'Thảo luận chờ duyệt',
  publishedarticles: 'Bài viết đã xuất bản',
  draftarticles: 'Bài viết bản nháp',
  publishedcultivationarticles: 'Bài trồng & chăm sóc đã xuất bản',
  draftcultivationarticles: 'Bài trồng & chăm sóc bản nháp',
  totalpublishedcultivationarticles: 'Bài trồng & chăm sóc đã xuất bản',
  publishedapplicationarticles: 'Bài ứng dụng đã xuất bản',
  draftapplicationarticles: 'Bài ứng dụng bản nháp',
  totalpublishedapplicationarticles: 'Bài ứng dụng đã xuất bản',
  recentorchids: 'Các loài lan vừa thêm',
  recentdocuments: 'Tài liệu vừa thêm',
  recentusers: 'Người dùng mới',
  recentdiscussions: 'Thảo luận gần đây',
  recentarticles: 'Bài viết gần đây',
  orchidsbyregion: 'Loài lan theo khu vực',
  orchidsbybloomseason: 'Loài lan theo mùa hoa',
  orchidsbycolor: 'Loài lan theo màu sắc',
  orchidsbycategory: 'Loài lan theo danh mục',
  articlesbystatus: 'Bài viết theo trạng thái',
  articlesbytype: 'Bài viết theo loại',
  usersbyrole: 'Người dùng theo vai trò',
  discussionsbystatus: 'Thảo luận theo trạng thái',
  approveddiscussions: 'Thảo luận đã duyệt',
  rejecteddiscussions: 'Thảo luận bị từ chối',
  pendingarticles: 'Bài viết chờ duyệt',
  activeusers: 'Người dùng đang hoạt động',
  inactiveusers: 'Người dùng ngừng hoạt động',
  totalimages: 'Hình ảnh',
  imagecount: 'Hình ảnh',
};

const WORDS: Record<string, string> = {
  total: 'Tổng', recent: 'Gần đây', published: 'Đã xuất bản', draft: 'Bản nháp', pending: 'Chờ duyệt',
  approved: 'Đã duyệt', rejected: 'Bị từ chối', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động',
  orchid: 'loài lan', orchids: 'loài lan', category: 'danh mục', categories: 'danh mục', document: 'tài liệu', documents: 'tài liệu',
  user: 'người dùng', users: 'người dùng', article: 'bài viết', articles: 'bài viết', discussion: 'thảo luận', discussions: 'thảo luận',
  cultivation: 'trồng & chăm sóc', application: 'ứng dụng', applications: 'ứng dụng', image: 'hình ảnh', images: 'hình ảnh',
  by: 'theo', region: 'khu vực', regions: 'khu vực', color: 'màu sắc', colors: 'màu sắc', status: 'trạng thái', type: 'loại', role: 'vai trò',
  count: 'số lượng', season: 'mùa hoa', bloom: 'nở hoa', month: 'tháng', year: 'năm', today: 'hôm nay', this: 'trong', new: 'mới',
};

const titleFromKey = (key: string) => {
  const known = LABELS[normalizeKey(key)];
  if (known) return known;
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => WORDS[word.toLowerCase()] ?? word.toLocaleLowerCase('vi-VN'));
  return words.join(' ').replace(/^./, (character) => character.toLocaleUpperCase('vi-VN'));
};

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const collectMetrics = (source: DashboardOverview): MetricItem[] => {
  const metrics: MetricItem[] = [];
  const walk = (value: Record<string, unknown>, prefix = '', depth = 0) => {
    Object.entries(value).forEach(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof item === 'number' && Number.isFinite(item)) {
        metrics.push({ key: path, label: titleFromKey(key), value: item });
      } else if (depth < 1 && isRecord(item)) {
        walk(item, path, depth + 1);
      }
    });
  };
  walk(source);
  const priority = (metric: MetricItem) => normalizeKey(metric.key).includes('total') ? 0 : 1;
  return metrics.sort((first, second) => priority(first) - priority(second)).slice(0, 8);
};

const metricIcon = (key: string): ReactNode => {
  const normalized = normalizeKey(key);
  if (normalized.includes('orchid')) return <Flower2 className="h-5 w-5" />;
  if (normalized.includes('categor')) return <FolderTree className="h-5 w-5" />;
  if (normalized.includes('user')) return <Users className="h-5 w-5" />;
  if (normalized.includes('document')) return <BookOpen className="h-5 w-5" />;
  if (normalized.includes('discussion')) return <MessageSquare className="h-5 w-5" />;
  if (normalized.includes('article')) return <FileText className="h-5 w-5" />;
  return <BarChart3 className="h-5 w-5" />;
};

const getItemTitle = (item: unknown, fallback: string) => {
  if (!isRecord(item)) return String(item);
  for (const key of ['name', 'title', 'fullName', 'email', 'content', 'label', 'type']) {
    if (typeof item[key] === 'string' && item[key]) return String(item[key]);
  }
  return fallback;
};

const getItemMeta = (item: unknown) => {
  if (!isRecord(item)) return '';
  for (const key of ['createdAt', 'updatedAt', 'publishedAt', 'date', 'status', 'description', 'summary']) {
    const value = item[key];
    if (typeof value === 'string' && value) {
      if (key.toLowerCase().includes('at') || key === 'date') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date.toLocaleString('vi-VN');
      }
      return value;
    }
  }
  return '';
};

export default function AdminDashboardOverview({
  displayName,
  onAddOrchid,
  onAddUser,
  onOpenOrchids,
  onOpenDocuments,
  onOpenDiscussions,
  onOpenListItem,
}: AdminDashboardOverviewProps) {
  const [overview, setOverview] = useState<DashboardOverview>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOverview(await getDashboardOverview());
      setLastUpdated(new Date());
    } catch (loadError) {
      setOverview({});
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const metrics = useMemo(() => collectMetrics(overview), [overview]);
  const listSections = useMemo(() => Object.entries(overview)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => ({ key, label: titleFromKey(key), items: value as unknown[] }))
    .slice(0, 2), [overview]);
  const breakdowns = useMemo(() => Object.entries(overview)
    .filter(([, value]) => isRecord(value) && Object.values(value).filter((item) => typeof item === 'number').length >= 2)
    .map(([key, value]) => ({
      key,
      label: titleFromKey(key),
      items: Object.entries(value as Record<string, unknown>)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
    }))
    .slice(0, 2), [overview]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h2 className="font-display-serif text-3xl font-semibold tracking-tight text-on-surface">Tổng quan hệ thống</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chào {displayName}. Toàn bộ số liệu bên dưới được đồng bộ từ API Dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && <span className="text-[11px] text-outline">Cập nhật {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" onClick={() => void loadOverview()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cfd2cb] bg-white px-4 text-xs font-semibold text-[#434748] transition-colors hover:border-[#667234] hover:text-[#56642b] disabled:cursor-wait disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row">
          <span>{error}</span>
          <button type="button" onClick={() => void loadOverview()} className="font-bold underline">Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#e1e3dc] bg-white" />)}
        </div>
      ) : metrics.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <article key={metric.key} className="group relative overflow-hidden rounded-2xl border border-[#dfe2d8] bg-white p-5 shadow-[0_8px_24px_rgba(43,48,31,0.04)]">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#eef1e2] transition-transform group-hover:scale-125" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1e2] text-[#5c692d]">{metricIcon(metric.key)}</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9a8650]">#{String(index + 1).padStart(2, '0')}</span>
              </div>
              <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#747878]">{metric.label}</p>
              <p className="relative mt-1 font-display-serif text-3xl font-semibold text-[#1a1c1b]">{formatNumber(metric.value)}</p>
            </article>
          ))}
        </div>
      ) : !error && (
        <div className="rounded-2xl border border-dashed border-[#cfd2cb] bg-white p-10 text-center text-sm text-outline">API chưa trả về chỉ số thống kê dạng số.</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          {breakdowns.map((section) => {
            const maximum = Math.max(...section.items.map(([, value]) => value), 1);
            return (
              <section key={section.key} className="rounded-2xl border border-[#dfe2d8] bg-white p-6 shadow-[0_8px_24px_rgba(43,48,31,0.035)]">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display-serif text-xl font-semibold">{section.label}</h3>
                  <BarChart3 className="h-5 w-5 text-[#667234]" />
                </div>
                <div className="space-y-4">
                  {section.items.map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-xs"><span className="font-medium text-[#434748]">{titleFromKey(key)}</span><strong>{formatNumber(value)}</strong></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#eef0e9]"><div className="h-full rounded-full bg-gradient-to-r from-[#56642b] to-[#9baa62]" style={{ width: `${Math.max(4, (value / maximum) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {listSections.map((section) => (
            <section key={section.key} className="rounded-2xl border border-[#dfe2d8] bg-white p-6 shadow-[0_8px_24px_rgba(43,48,31,0.035)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-display-serif text-xl font-semibold">{section.label}</h3>
                <span className="rounded-full bg-[#eef1e2] px-2.5 py-1 text-[10px] font-bold text-[#56642b]">{section.items.length}</span>
              </div>
              <div className="divide-y divide-[#eceee8]">
                {section.items.slice(0, 6).map((item, index) => (
                  <button type="button" key={isRecord(item) && typeof item.id === 'string' ? item.id : `${section.key}-${index}`} onClick={() => onOpenListItem(section.key, item)} className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-[#56642b]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f3e8] text-xs font-bold text-[#667234]">{index + 1}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#1a1c1b]">{getItemTitle(item, `Mục ${index + 1}`)}</p>{getItemMeta(item) && <p className="mt-0.5 truncate text-[10px] text-outline">{getItemMeta(item)}</p>}</div>
                    <span className="pr-1 text-sm text-[#899073] transition-transform group-hover:translate-x-1">→</span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {!loading && breakdowns.length === 0 && listSections.length === 0 && !error && (
            <section className="rounded-2xl border border-[#dfe2d8] bg-white p-8 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-[#899073]" />
              <p className="mt-3 text-sm font-semibold">Các chỉ số tổng quan đã được đồng bộ.</p>
              <p className="mt-1 text-xs text-outline">Khi API bổ sung nhóm hoặc danh sách chi tiết, dashboard sẽ tự hiển thị tại đây.</p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-[#2d351d] p-6 text-white shadow-[0_12px_30px_rgba(45,53,29,0.16)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6e7a1]">Thao tác nhanh</p>
            <h3 className="mt-2 font-display-serif text-2xl">Quản trị nội dung</h3>
            <p className="mt-2 text-xs leading-5 text-white/65">Đi thẳng đến các tác vụ thường dùng mà không rời dashboard.</p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={onAddOrchid} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-left text-xs font-bold text-[#2d351d] transition-transform hover:-translate-y-0.5"><Plus className="h-4 w-4" /> Thêm loại lan mới</button>
              <button type="button" onClick={onAddUser} className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-xs font-bold text-white transition-colors hover:bg-white/10"><UserPlus className="h-4 w-4" /> Thêm người dùng</button>
              <button type="button" onClick={onOpenDiscussions} className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-xs font-bold text-white transition-colors hover:bg-white/10"><MessageSquare className="h-4 w-4" /> Quản lý thảo luận</button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dfe2d8] bg-white p-6">
            <h3 className="font-display-serif text-lg font-semibold">Truy cập nhanh</h3>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={onOpenOrchids} className="flex w-full items-center justify-between rounded-xl bg-[#f4f5ef] px-4 py-3 text-left text-xs font-semibold transition-colors hover:bg-[#eef1e2]"><span className="flex items-center gap-2"><Flower2 className="h-4 w-4 text-[#667234]" /> Kho loài lan</span><span>→</span></button>
              <button type="button" onClick={onOpenDocuments} className="flex w-full items-center justify-between rounded-xl bg-[#f4f5ef] px-4 py-3 text-left text-xs font-semibold transition-colors hover:bg-[#eef1e2]"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#667234]" /> Thư viện tài liệu</span><span>→</span></button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
