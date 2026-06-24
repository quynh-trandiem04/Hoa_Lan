/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSuccess: (name: string, role: string, email: string) => void;
}

export const InviteAdminModal: React.FC<InviteAdminModalProps> = ({ isOpen, onClose, onInviteSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Biên tập viên');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng cung cấp họ tên của người đại diện.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng cung cấp hòm thư điện tử chính quy hợp lệ.');
      return;
    }

    setErrorMsg('');
    onInviteSuccess(name, role, email);
    // Reset state
    setName('');
    setEmail('');
    setRole('Biên tập viên');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-text/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2 text-botanical-green">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-on-surface">Mời Quản Trị Viên Mới</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-charcoal-text hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Cung cấp quyền truy cập chỉnh sửa hệ thống cơ sở dữ liệu Orchidée Luxe cho các thanh tra viên động thực vật hoặc đối tác nghiên cứu cao cấp của thương hiệu.
            </p>

            {errorMsg && (
              <div className="p-3 bg-error-container/20 border border-error/20 text-error text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Hoàng Đức Anh"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="duc_anh@orchideeluxe.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Vai trò quản trị</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-botanical-green"
              >
                <option value="Quản trị tối cao (Super Admin)">Quản trị tối cao (Super Admin)</option>
                <option value="Biên tập viên (Editor)">Biên tập viên (Editor)</option>
                <option value="Nhà nghiên cứu (Researcher)">Nhà nghiên cứu (Researcher)</option>
                <option value="Cộng tác viên nội dung">Cộng tác viên nội dung</option>
              </select>
            </div>

            <div className="p-3 bg-soft-olive/10 rounded-lg flex gap-2 items-start text-[11px] text-on-secondary-container">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
              <span>Người được mời sẽ nhận được một bức thư điện tử chứa liên kết thiết lập mật khẩu truy cập an toàn với thời hạn trong vòng 48 giờ kể từ lúc phát hành.</span>
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline text-on-surface-variant font-medium text-xs uppercase hover:bg-surface-container transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-botanical-green text-on-secondary font-medium text-xs uppercase hover:opacity-90 transition-all rounded"
            >
              Gửi lời mời
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
