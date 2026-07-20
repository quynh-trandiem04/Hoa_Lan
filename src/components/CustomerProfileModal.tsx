import React, { useEffect, useMemo, useState } from 'react';
import { Heart, ImagePlus, LoaderCircle, LockKeyhole, Save, Trash2, X } from 'lucide-react';
import {
  getOrchidById,
  getUserById,
  getUsers,
  resetUserPassword,
  updateUser,
  uploadImage,
  type UserListItem,
} from '../services/api';
import type { Orchid } from '../types';
import { getOrchidImageUrls } from '../utils/orchidImages';

interface CustomerProfileModalProps {
  open: boolean;
  onClose: () => void;
  standalone?: boolean;
  initialTab?: 'profile' | 'favorites';
}

const getStorage = () => localStorage.getItem('orchidee_auth_token') ? localStorage : sessionStorage;

const decodeJwt = (token: string): Record<string, unknown> | null => {
  try {
    const raw = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(Array.from(atob(raw), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
  } catch {
    return null;
  }
};

const readSessionProfile = (): UserListItem | null => {
  const storage = getStorage();
  const raw = storage.getItem('orchidee_user');
  if (raw) {
    try {
      const profile = JSON.parse(raw) as UserListItem;
      if (profile?.email) return profile;
    } catch {
      // Reconstruct from the authenticated session below.
    }
  }
  const email = storage.getItem('orchidee_admin_user') || '';
  const claims = decodeJwt(storage.getItem('orchidee_auth_token') || '');
  const id = String(
    claims?.nameid
    || claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    || claims?.sub
    || '',
  );
  if (!email) return null;
  return { id, email, fullName: String(claims?.name || claims?.unique_name || email), avatarUrl: '' };
};

const readFavoriteIds = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem('orchidee-luxe-bookmarks-v2') || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export default function CustomerProfileModal({ open, onClose, standalone = false, initialTab = 'profile' }: CustomerProfileModalProps) {
  const [tab, setTab] = useState<'profile' | 'favorites'>('profile');
  const [profile, setProfile] = useState<UserListItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteOrchids, setFavoriteOrchids] = useState<Orchid[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initials = useMemo(() => (fullName || profile?.email || '?').trim().charAt(0).toUpperCase(), [fullName, profile]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const sessionProfile = readSessionProfile();
    setProfile(sessionProfile);
    setFullName(sessionProfile?.fullName || '');
    setAvatarUrl(sessionProfile?.avatarUrl || '');
    setTab(initialTab);
    setMessage('');
    setError('');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(true);

    void (async () => {
      let resolved = sessionProfile;
      try {
        if (sessionProfile?.id) {
          resolved = await getUserById(sessionProfile.id);
        } else if (sessionProfile?.email) {
          const result = await getUsers(1, 10, sessionProfile.email);
          resolved = result.items.find((item) => item.email.toLowerCase() === sessionProfile.email.toLowerCase()) || sessionProfile;
        }
      } catch {
        // The saved JWT profile remains usable if Users API does not expose the current account.
      }
      if (!active) return;
      if (resolved) {
        setProfile(resolved);
        setFullName(resolved.fullName || '');
        setAvatarUrl(resolved.avatarUrl || '');
      }

      const ids = readFavoriteIds();
      setFavoriteIds(ids);
      const orchids = await Promise.all(ids.map((id) => getOrchidById(id).catch(() => null)));
      if (active) setFavoriteOrchids(orchids.filter((orchid): orchid is Orchid => orchid !== null));
      if (active) setLoading(false);
    })();

    return () => { active = false; };
  }, [open, initialTab]);

  if (!open) return null;

  const saveProfileToSession = (next: UserListItem) => {
    const storage = getStorage();
    storage.setItem('orchidee_user', JSON.stringify(next));
    window.dispatchEvent(new Event('orchidee-profile-updated'));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn đúng tệp ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh đại diện không được lớn hơn 10 MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadImage(file);
      setAvatarUrl(uploaded.url);
      setMessage('Ảnh đã tải lên. Nhấn “Lưu thay đổi” để cập nhật hồ sơ.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.id || !profile.email) {
      setError('Không xác định được ID hồ sơ từ phiên đăng nhập.');
      return;
    }
    if (!fullName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateUser(profile.id, { email: profile.email, fullName: fullName.trim(), avatarUrl });
      const next = { ...profile, fullName: fullName.trim(), avatarUrl };
      setProfile(next);
      saveProfileToSession(next);
      setMessage('Đã cập nhật thông tin tài khoản.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile?.id) {
      setError('Không xác định được ID hồ sơ từ phiên đăng nhập.');
      return;
    }
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      setError(newPassword.length < 6 ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await resetUserPassword(profile.id, newPassword, confirmPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Đã thay đổi mật khẩu.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Không thể đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  };

  const removeFavorite = (id: string) => {
    const nextIds = favoriteIds.filter((favoriteId) => favoriteId !== id);
    setFavoriteIds(nextIds);
    setFavoriteOrchids((current) => current.filter((orchid) => orchid.id !== id));
    localStorage.setItem('orchidee-luxe-bookmarks-v2', JSON.stringify(nextIds));
    window.dispatchEvent(new Event('orchidee-favorites-updated'));
  };

  return (
    <div
      className={standalone
        ? 'w-full'
        : 'fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]'}
      onMouseDown={standalone ? undefined : onClose}
    >
      <section
        className={`flex w-full flex-col overflow-hidden rounded-2xl border border-[#dfe1dc] bg-[#fffef9] ${standalone ? 'shadow-sm' : 'max-h-[90vh] max-w-3xl shadow-2xl'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#e2e3de] px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">Quản lý hồ sơ</h2>
            <p className="mt-1 text-xs text-[#747878]">Cập nhật tài khoản và quản lý những loài lan bạn yêu thích.</p>
          </div>
          {!standalone && <button type="button" onClick={onClose} className="rounded-full p-2 text-[#747878] hover:bg-[#56642b]/10" aria-label="Đóng"><X size={20} /></button>}
        </header>

        <nav className="flex border-b border-[#e2e3de] px-6">
          <button type="button" onClick={() => setTab('profile')} className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider ${tab === 'profile' ? 'border-[#56642b] text-[#56642b]' : 'border-transparent text-[#747878]'}`}>Thông tin tài khoản</button>
          <button type="button" onClick={() => setTab('favorites')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider ${tab === 'favorites' ? 'border-[#56642b] text-[#56642b]' : 'border-transparent text-[#747878]'}`}><Heart size={15} /> Lan yêu thích ({favoriteIds.length})</button>
        </nav>

        <div className={standalone ? 'p-6' : 'overflow-y-auto p-6'}>
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-[#56642b]"><LoaderCircle className="animate-spin" /></div>
          ) : tab === 'profile' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d5d7d3] bg-[#edf1e2] text-3xl font-bold text-[#56642b]">
                  {avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
                </div>
                <div>
                  <label className={`inline-flex items-center gap-2 rounded-lg bg-[#56642b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
                    {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                    {uploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading || saving} onChange={(event) => void handleAvatarUpload(event)} className="hidden" />
                  </label>
                  <p className="mt-2 text-xs text-[#747878]">JPG, PNG, WEBP hoặc GIF; tối đa 10 MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666b69]">Họ và tên
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d5d7d3] bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#56642b]" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666b69]">Email
                  <input value={profile?.email || ''} readOnly className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-[#d5d7d3] bg-[#eeeeea] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#747878]" />
                </label>
              </div>
              <button type="button" onClick={() => void handleSaveProfile()} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>

              <div className="border-t border-[#e2e3de] pt-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold"><LockKeyhole size={18} /> Đổi mật khẩu</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mật khẩu mới" className="rounded-lg border border-[#d5d7d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#56642b]" />
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Xác nhận mật khẩu mới" className="rounded-lg border border-[#d5d7d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#56642b]" />
                </div>
                <button type="button" onClick={() => void handleChangePassword()} disabled={saving} className="mt-4 rounded-lg border border-[#56642b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#56642b] disabled:opacity-50">Cập nhật mật khẩu</button>
              </div>
            </div>
          ) : favoriteOrchids.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <Heart size={34} className="mb-3 text-[#899073]" />
              <h3 className="font-serif text-xl font-bold">Chưa có lan yêu thích</h3>
              <a href="/list-orchids" className="mt-4 rounded-lg bg-[#56642b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white">Khám phá hoa lan</a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {favoriteOrchids.map((orchid) => (
                <article key={orchid.id} className="relative flex overflow-hidden rounded-xl border border-[#e0e1dc] bg-white">
                  <a href={`/orchids/${orchid.id}`} className="h-28 w-28 shrink-0 bg-[#eeeeea]"><img src={getOrchidImageUrls(orchid)[0]} alt={orchid.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" /></a>
                  <div className="min-w-0 flex-1 p-3">
                    <a href={`/orchids/${orchid.id}`} className="line-clamp-2 font-serif text-base font-bold hover:text-[#56642b]">{orchid.name}</a>
                    <p className="mt-1 truncate text-xs italic text-[#747878]">{orchid.englishName}</p>
                    <button
                      type="button"
                      onClick={() => orchid.id && removeFavorite(orchid.id)}
                      className="absolute bottom-3 right-3 rounded-full p-2 text-red-600 transition-colors hover:bg-red-50"
                      aria-label={`Bỏ ${orchid.name} khỏi danh sách yêu thích`}
                      title="Bỏ yêu thích"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {(error || message) && <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || message}</div>}
        </div>
      </section>
    </div>
  );
}
