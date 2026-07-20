import React from 'react';
import CustomerProfileModal from '../components/CustomerProfileModal';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';

export default function CustomerProfile() {
  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'favorites'
    ? 'favorites'
    : 'profile';
  const isAuthenticated = Boolean(
    localStorage.getItem('orchidee_auth_token')
    || sessionStorage.getItem('orchidee_auth_token'),
  );

  if (!isAuthenticated) {
    window.location.replace(`/login?returnUrl=${encodeURIComponent('/profile')}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-[#1a1c1b]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#747878]">
          <a href="/" className="hover:text-[#56642b]">Trang chủ</a>
          <span>›</span>
          <span className="text-[#1a1c1b]">Hồ sơ cá nhân</span>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#56642b]">Không gian thành viên</p>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Hồ sơ &amp; Lan yêu thích</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666b69]">
            Quản lý thông tin tài khoản, ảnh đại diện, mật khẩu và bộ sưu tập hoa lan bạn đã lưu.
          </p>
        </div>

        <CustomerProfileModal open standalone initialTab={initialTab} onClose={() => {}} />
      </main>
      <PublicFooter />
    </div>
  );
}
