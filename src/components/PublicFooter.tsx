export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-botanical-green/10 bg-surface-cream py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-12 md:px-16">
        <div className="space-y-3 md:col-span-5">
          <a href="/" className="orchids-logo text-2xl text-botanical-green">
            Orchids
          </a>
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
            Website quản lý và cung cấp thông tin về hoa lan, được xây dựng phục vụ khóa luận tốt nghiệp.
          </p>
        </div>

        <div className="md:col-span-4">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-botanical-green">Chức năng</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="/list-orchids" className="text-on-surface-variant transition-colors hover:text-botanical-green">Danh mục hoa lan</a></li>
            <li><a href="/planting-and-care" className="text-on-surface-variant transition-colors hover:text-botanical-green">Cách trồng và chăm sóc</a></li>
            <li><a href="/applications" className="text-on-surface-variant transition-colors hover:text-botanical-green">Ứng dụng</a></li>
            <li><a href="/document" className="text-on-surface-variant transition-colors hover:text-botanical-green">Tài liệu</a></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-botanical-green">Liên kết</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="/" className="text-on-surface-variant transition-colors hover:text-botanical-green">Trang chủ</a></li>
            <li><a href="/discussion" className="text-on-surface-variant transition-colors hover:text-botanical-green">Thảo luận</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-outline-variant/20 px-6 pt-6 md:px-16">
        <p className="text-xs text-on-surface-variant/80">© 2026 Orchids. Khóa luận tốt nghiệp.</p>
      </div>
    </footer>
  );
}
