import React from 'react';
import { Globe2, Share2 } from 'lucide-react';

const shareSite = async () => {
  const shareData = {
    title: 'Orchids',
    text: 'Nền tảng nghiên cứu và quản lý hoa lan chuyên nghiệp.',
    url: window.location.href,
  };
  if (navigator.share) {
    await navigator.share(shareData).catch(() => undefined);
    return;
  }
  await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
};

export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-botanical-green/10 bg-surface-cream py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-12 md:px-16">
        <div className="space-y-4 md:col-span-4">
          <a href="/" className="font-serif text-2xl font-bold italic text-botanical-green">Orchids</a>
          <p className="max-w-sm font-sans text-xs leading-relaxed text-on-surface-variant">
            Nền tảng nghiên cứu và quản lý hoa lan chuyên nghiệp, cam kết vì sự bền vững và vẻ đẹp của thiên nhiên thông qua các phương pháp bảo tồn khoa học.
          </p>
        </div>

        <div className="md:col-span-4 md:col-start-6">
          <h4 className="mb-5 font-sans text-xs font-bold uppercase tracking-widest text-botanical-green">Nghiên cứu</h4>
          <ul className="space-y-3 font-sans text-xs">
            <li><a href="/list-orchids" className="text-on-surface-variant transition-colors hover:text-botanical-green">Cơ sở dữ liệu chi loài</a></li>
            <li><a href="/document" className="text-on-surface-variant transition-colors hover:text-botanical-green">Tài liệu bảo tồn lâm nghiệp</a></li>
            <li><a href="/planting-and-care" className="text-on-surface-variant transition-colors hover:text-botanical-green">Hệ sinh thái Orchidaceae</a></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="mb-5 font-sans text-xs font-bold uppercase tracking-widest text-botanical-green">Thông tin</h4>
          <ul className="space-y-3 font-sans text-xs">
            <li><a href="/" className="text-on-surface-variant transition-colors hover:text-botanical-green">Về chúng tôi</a></li>
            <li><a href="/discussion" className="text-on-surface-variant transition-colors hover:text-botanical-green">Liên hệ cố vấn</a></li>
            <li><a href="/#privacy" className="text-on-surface-variant transition-colors hover:text-botanical-green">Chính sách bảo mật</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-outline-variant/20 px-6 pt-8 md:flex-row md:px-16">
        <p className="font-sans text-xs text-on-surface-variant/80">© 2026 Orchids. L'art de vivre botanical research.</p>
        <div className="flex gap-6 text-[#747878]">
          <button type="button" className="transition-colors hover:text-botanical-green" title="Ngôn ngữ: Tiếng Việt">
            <Globe2 className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={() => void shareSite()} className="transition-colors hover:text-botanical-green" title="Chia sẻ trang">
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
