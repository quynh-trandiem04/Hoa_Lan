import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Upload, UserPlus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadImage, type UserListItem } from '../services/api';

export interface UserFormValues {
  fullName: string;
  email: string;
  avatarUrl: string;
  password: string;
  confirmPassword: string;
}

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: UserListItem | null;
  onSave: (values: UserFormValues) => Promise<void>;
}

export const InviteAdminModal: React.FC<InviteAdminModalProps> = ({
  isOpen,
  onClose,
  editUser = null,
  onSave,
}) => {
  const [values, setValues] = useState<UserFormValues>({
    fullName: '', email: '', avatarUrl: '', password: '', confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isEditing = Boolean(editUser);

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      fullName: editUser?.fullName ?? '',
      email: editUser?.email ?? '',
      avatarUrl: editUser?.avatarUrl ?? '',
      password: '',
      confirmPassword: '',
    });
    setErrorMsg('');
  }, [isOpen, editUser]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn đúng tệp hình ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ảnh đại diện không được vượt quá 10 MB.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded.url) throw new Error('API Images không trả về URL ảnh.');
      setValues((current) => ({ ...current, avatarUrl: uploaded.url }));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }
    if (!values.email.trim() || !values.email.includes('@')) {
      setErrorMsg('Vui lòng nhập email hợp lệ.');
      return;
    }
    if (!isEditing && (!values.password || !values.confirmPassword)) {
      setErrorMsg('Vui lòng nhập và xác nhận mật khẩu.');
      return;
    }
    if (isEditing && Boolean(values.password) !== Boolean(values.confirmPassword)) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
      return;
    }
    if (values.password && values.password !== values.confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        avatarUrl: values.avatarUrl.trim(),
      });
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể lưu người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div className="flex items-center gap-2 text-botanical-green">
            <UserPlus className="h-5 w-5" />
            <h3 className="font-serif text-lg font-bold text-on-surface">
              {isEditing ? 'Cập Nhật Người Dùng' : 'Tạo Người Dùng Mới'}
            </h3>
          </div>
          <button type="button" onClick={onClose} disabled={submitting || uploadingAvatar} className="rounded-full p-1 text-outline hover:text-charcoal-text disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            {errorMsg && <div className="rounded-lg border border-error/20 bg-error-container/20 p-3 text-xs text-error">{errorMsg}</div>}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Họ và tên *</label>
              <input value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-botanical-green" />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Email *</label>
              <input
                type="email"
                value={values.email}
                readOnly={isEditing}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                className={`w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none ${
                  isEditing ? 'cursor-not-allowed bg-gray-100 text-outline' : 'bg-surface-container-low focus:border-botanical-green'
                }`}
              />
              {isEditing && <p className="text-[10px] text-outline">Email đăng nhập không thể thay đổi.</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Ảnh đại diện</label>
              <div className="flex items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-white">
                  {values.avatarUrl ? (
                    <img src={values.avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-outline" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[10px] leading-relaxed text-outline">JPG, PNG, WEBP hoặc GIF; tối đa 10 MB.</p>
                  <div className="flex flex-wrap gap-2">
                    <label className={`inline-flex items-center gap-2 rounded bg-botanical-green px-3 py-2 text-[10px] font-bold uppercase text-white ${
                      uploadingAvatar || submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'
                    }`}>
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingAvatar ? 'Đang tải...' : values.avatarUrl ? 'Chọn ảnh khác' : 'Chọn ảnh'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={uploadingAvatar || submitting}
                        onChange={(event) => void handleAvatarUpload(event)}
                        className="hidden"
                      />
                    </label>
                    {values.avatarUrl && (
                      <button
                        type="button"
                        disabled={uploadingAvatar || submitting}
                        onClick={() => setValues((current) => ({ ...current, avatarUrl: '' }))}
                        className="rounded border border-error/30 px-3 py-2 text-[10px] font-bold uppercase text-error hover:bg-error-container/20 disabled:opacity-50"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{isEditing ? 'Mật khẩu mới' : 'Mật khẩu *'}</label>
                <input type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder={isEditing ? 'Để trống nếu không đổi' : ''} className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-botanical-green" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{isEditing ? 'Xác nhận mật khẩu mới' : 'Xác nhận *'}</label>
                <input type="password" value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} placeholder={isEditing ? 'Để trống nếu không đổi' : ''} className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-botanical-green" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container-low p-4">
            <button type="button" onClick={onClose} disabled={submitting || uploadingAvatar} className="border border-outline px-4 py-2 text-xs font-medium uppercase disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={submitting || uploadingAvatar} className="rounded bg-botanical-green px-5 py-2 text-xs font-medium uppercase text-white disabled:opacity-60">
              {uploadingAvatar ? 'Đang tải ảnh...' : submitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
