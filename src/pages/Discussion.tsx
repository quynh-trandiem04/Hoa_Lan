import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Heart, Send, Camera, X, ShieldAlert, BadgeCheck, Flame, Trash2, Milestone } from "lucide-react";
import { DiscussionPost as Post, DiscussionComment as Comment } from "../types";

// Static premium images referenced in original layout for easy community mock attaches
const PHOTO_ATTACH_OPTIONS = [
  {
    id: "orchid-white-macro",
    label: "Hồ điệp trắng chụp vĩ mô",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCw9jJ08Pac7GorWGvEAJJZTrV-ZpCwqMuj4AF8zmQgG212XsSj1bXg4zSy4QJ3CdKPBFGx30NLXHN8DBjiNme2LhFKImt3Si2wumtuGzZqviQ7ygSEWu7PvoBhP0Eh5qllChLmSeVC8jLet9fFq2eajPQDuWc8VsM0skxgwfhqXK_GLy_i2eidED8ypjYhE9VETBCv8V-IWXiqmna2qRkudyffc7inoHKCbmUshEMg0nNQUaodsNA_jGv2wTuBkLjZLqpUHXL9RIOG"
  },
  {
    id: "orchid-arrangement-living",
    label: "Giỏ lan trưng cắm phòng khách",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmtpn39Bekjv0ckRVAh4Z0746tCuKJ2eBXWh3Fata6k4PlmMqGLv5Qmg1zTLtizLodTIWS9JRTNEjmWCmZmi2RxlsJEGZglO4OqboeHo1eGprbGAJh7LxyCEAIVleE6UdaUz2yRA-aRl-KGvbHC7wHhATtp2nXNIQXZmi-aexn8oDGiHCxeKks9tDb6djC5vvjFb-S6UDjQiSLnRaEG3l1tJnVOusr-UATglYopfBcgjEujosZxkvB6ahyOBJoPuvWRXZVKHxjTmYq"
  },
  {
    id: "golden-portrait-warm",
    label: "Sắc hoa lan ấm áp nắng vàng",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNBc6LpLFQfynDEUaKoMA4FEPHYYzXmtiYF0-S_IfBek8ko1nNhNSTGnxjimguvypdjuFQb89K6HfibHzCof-nJIR53UCoKui6Ywioa6WZPB0WQ1GG87Fx9TjApQSy0zQOatiJO8RQvDooLy4diA4QmC5YA3Op8QKyd6KSgkjOHQuiOiJ6caeKImUqu0b5x4IT_EOVxynXC7GJJbguRZ5_t03-OSgEAfmRCSsYYlpsCw8V12c2LGrpSDTGYoLtaYoNi-l6FLPfFZDu"
  }
];

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    authorName: "Minh Nguyễn",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1dE7FtZPo2w3tFNmER0jmssN9LSILyTp2bAtxG49BocUpMQ6U3eL4htED3XurGhWyNLdxuE-7NnkGJp6XL3C0tomTmeaWXde21z0l4EKpJreeHhKi0FlLhj1FcPLC7KJEr7AQSj1h_-F6HYM4AF5Tqbdz3MWip4_23Yqe2Wh0rcMqQu1QOiKiDfh-luJTZ5gmHvPu6OuWPG2U23G9xOm_YYWEEOm82CrukU1LvGqr6V1T-fprZwLU5KlU83Hg_tuEO9YZBCXs7nbK",
    timeAgo: "2 giờ trước",
    content: "Mẫu lan hồ điệp trắng vừa nở sáng nay tại vườn nhà. Vẻ đẹp tinh khiết thật sự làm tâm hồn thư thái hơn rất nhiều. Chào cả nhà ngày mới!",
    imageSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmtpn39Bekjv0ckRVAh4Z0746tCuKJ2eBXWh3Fata6k4PlmMqGLv5Qmg1zTLtizLodTIWS9JRTNEjmWCmZmi2RxlsJEGZglO4OqboeHo1eGprbGAJh7LxyCEAIVleE6UdaUz2yRA-aRl-KGvbHC7wHhATtp2nXNIQXZmi-aexn8oDGiHCxeKks9tDb6djC5vvjFb-S6UDjQiSLnRaEG3l1tJnVOusr-UATglYopfBcgjEujosZxkvB6ahyOBJoPuvWRXZVKHxjTmYq",
    likes: 24,
    likedByCurrentUser: false,
    tags: ["#ChamSocLanHoDiep", "#BaoTonThienNhien"],
    comments: [
      {
        id: "com-1",
        authorName: "Linh Chi",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNBc6LpLFQfynDEUaKoMA4FEPHYYzXmtiYF0-S_IfBek8ko1nNhNSTGnxjimguvypdjuFQb89K6HfibHzCof-nJIR53UCoKui6Ywioa6WZPB0WQ1GG87Fx9TjApQSy0zQOatiJO8RQvDooLy4diA4QmC5YA3Op8QKyd6KSgkjOHQuiOiJ6caeKImUqu0b5x4IT_EOVxynXC7GJJbguRZ5_t03-OSgEAfmRCSsYYlpsCw8V12c2LGrpSDTGYoLtaYoNi-l6FLPfFZDu",
        content: "Thật tuyệt vời! Bạn có dùng loại phân bón hữu cơ đặc biệt nào không?",
        timestamp: "1 giờ trước"
      },
      {
        id: "com-2",
        authorName: "Hoàng Anh",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdGE8tHYP0nPhlRFsRMGXjhxHYx3mAXgWiE8b_N024REdtq4-ESyLwVR1L9MkqANT56O6EeJJIknKHyU9O4K52lakZXBGJlWrfaKWGQ1_Dl2rsnFK8QfqvDSjWx0iD5838s1zMcL-iXWlOx_TIamqQ9GNql_tBsug0sQ57Vs2v-aciOwyzZaDaBG7tXcVjHEjMa0ySh_rDhh6n13Q9RjYlnFptxjh09tlo4bEXNe9lS8GM8D0S8HVxy5p9VY4umwXr0bwBMoBBg4y5",
        content: "Cành đơm bông khoẻ sắc chính trực, bẹ lá xòe đều cân xứng, tay nghề chủ vườn cực kỳ lão luyện!",
        timestamp: "30 phút trước"
      }
    ]
  },
  {
    id: "post-2",
    authorName: "Khánh Huyền",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXLx_Z6JSSB4few-cga6SEWeBcitac9udwUbMSC1ET-VwD8QXKfNW70fehyIhwAMZbbqWVtzdQWkvjLo-hcEMXBJLGYpMLezhYeRETXzqL_c4lYgQ9ZPv1zB3QRlqrm9AXZRxmCpIGaf4WXNMlQGW_Srl_-rUfPuDoB-BAljPk1V7be-NRze4u_jR7sDpAC1kHtBV5gBJzfIQqdr_HpVagiW8KFGyBJlzyFGGXbNPFm7RGze0kv2-hocaH4vgc1QFzBiKXVD5aLfDA",
    timeAgo: "6 giờ trước",
    content: "Lan rừng cần được bảo tồn chứ không nên tận thu bừa bãi. Mình vừa đóng góp thêm 2 giỏ ki nhỏ để nhân giống trả lại tự nhiên.",
    likes: 18,
    likedByCurrentUser: false,
    tags: ["#LanRungVietNam", "#BaoTonThienNhien"],
    comments: [
      {
        id: "com-3",
        authorName: "Minh Nguyễn",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1dE7FtZPo2w3tFNmER0jmssN9LSILyTp2bAtxG49BocUpMQ6U3eL4htED3XurGhWyNLdxuE-7NnkGJp6XL3C0tomTmeaWXde21z0l4EKpJreeHhKi0FlLhj1FcPLC7KJEr7AQSj1h_-F6HYM4AF5Tqbdz3MWip4_23Yqe2Wh0rcMqQu1QOiKiDfh-luJTZ5gmHvPu6OuWPG2U23G9xOm_YYWEEOm82CrukU1LvGqr6V1T-fprZwLU5KlU83Hg_tuEO9YZBCXs7nbK",
        content: "Ủng hộ tinh thần bảo vệ thiên nhiên của Huyền tuyệt đối!",
        timestamp: "4 giờ trước"
      }
    ]
  }
];

export default function CommunityTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState("");
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [activeHashtagFilter, setActiveHashtagFilter] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  // Comment states indexed by post ID
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Self avatar representing user
  const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuD5upV_MLCvVTEFNRGN6pYw0Oj5U5_-brSJF5EX7zhsUq2x1MnuYpN_QlurqYhAU-17jxBra6WlOUxEbkhCuMqEMko7QO38sRi-7Lgdb5566fmca7Z5JzS3jOItcHBuDOP99p2DMrDm7PP9Nbm5Rn6uQtCHlwbubi-mWvP52edx_gl4M0suTRkWAaWLsvmgYQlkgalAm-Bo-xzl76RxWO1vj_nXHT4RMBA57BGGZgmOU8ONoPD89lojRpIZDoiHzstHPqK_g7hjbRZh";

  // Load and cache posts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("orchidee_luxe_posts_v2");
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    } else {
      setPosts(INITIAL_POSTS);
    }
  }, []);

  const savePostsToStorage = (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("orchidee_luxe_posts_v2", JSON.stringify(updatedPosts));
  };

  // Handle local image file upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImageUrl(event.target.result as string);
          setShowPhotoOptions(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreloadedPhoto = (url: string) => {
    setAttachedImageUrl(url);
    setShowPhotoOptions(false);
  };

  // Submit absolute new post
  const handleSubmitPost = () => {
    const trimmed = postContent.trim();
    if (!trimmed && !attachedImageUrl) {
      alert("Vui lòng nhập nội dung chia sẻ hoặc đính kèm một đóa hoa xinh xắn.");
      return;
    }

    // Detect hashtags
    const hashtags: string[] = [];
    const hashtagRegex = /(#[a-zA-Z0-9_ÁàẢãÁạĂằẰẳẵẶÂầẦẩẫẬÉèẺẽẸÊềỀểễỆÍìỈĩỊÓòỎõỌÔồỒổỗỘƠờỜởỡỢÚùỦũỤƯừỪửữỰÝýỶỹỴđĐ]+)/g;
    let match;
    while ((match = hashtagRegex.exec(trimmed)) !== null) {
      hashtags.push(match[1]);
    }

    // Default tag if none
    if (hashtags.length === 0) {
      hashtags.push("#ChamSocLanHoDiep");
    }

    const newPost: Post = {
      id: "post-" + Date.now(),
      authorName: "Quỳnh Trần (Thành viên)",
      authorAvatar: USER_AVATAR,
      timeAgo: "Vừa xong",
      content: trimmed,
      imageSrc: attachedImageUrl || undefined,
      likes: 0,
      likedByCurrentUser: false,
      tags: hashtags,
      comments: []
    };

    const updated = [newPost, ...posts];
    savePostsToStorage(updated);
    setPostContent("");
    setAttachedImageUrl(null);
  };

  // Delete self posts
  const handleDeletePost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn gỡ bài chia sẻ này không?")) {
      const updated = posts.filter(p => p.id !== id);
      savePostsToStorage(updated);
    }
  };

  // Like posts with premium dynamic state toggle
  const handleToggleLike = (postId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const liked = !post.likedByCurrentUser;
        return {
          ...post,
          likedByCurrentUser: liked,
          likes: liked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    });
    savePostsToStorage(updated);
  };

  // Nested child comment poster
  const handlePostComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const updated = posts.map(post => {
      if (post.id === postId) {
        const newCom: Comment = {
          id: "com-" + Date.now(),
          authorName: "Quỳnh Trần (Thành viên)",
          authorAvatar: USER_AVATAR,
          content: text,
          timestamp: "Vừa xong",
          isUserComment: true
        };
        return {
          ...post,
          comments: [...post.comments, newCom]
        };
      }
      return post;
    });

    savePostsToStorage(updated);
    setCommentInputs({
      ...commentInputs,
      [postId]: ""
    });
  };

  const handleKeyPressComment = (e: React.KeyboardEvent, postId: string) => {
    if (e.key === "Enter") {
      handlePostComment(postId);
    }
  };

  // Filter logic
  const filteredPosts = activeHashtagFilter
    ? posts.filter(post => post.tags.some(tag => tag.toLowerCase() === activeHashtagFilter.toLowerCase()))
    : posts;

  return (
    <div className="min-h-screen bg-surface-cream text-[#1a1c1b] font-sans selection:bg-soft-olive selection:text-[#56642b]">
      {/* Header */}
            <header className="sticky top-0 w-full z-40 h-16 bg-surface-cream/95 backdrop-blur-md border-b border-[#56642b]/10 shadow-sm">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto h-full">
          <div className="font-serif italic text-xl md:text-2xl text-[#56642b] font-bold tracking-tight select-none">
            Orchids
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors">
              Trang Chủ
            </a>
            <div className="relative group">
              <button className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors flex items-center gap-1 cursor-pointer">
                DANH MỤC LAN
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-3.5 h-3.5 rotate-90" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
              </button>
              <div className="absolute top-full left-0 w-64 bg-surface-cream border border-[#747878]/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-3 mt-2 rounded">
                <ul className="flex flex-col">
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Rừng Tự Nhiên (Dendrobium)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Đột Biến (Phalaenopsis)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Hồ Điệp (Phalaenopsis)</button></li>
                  <li><button className="w-full text-left px-5 py-2.5 font-serif text-sm text-[#434748] hover:bg-[#56642b]/5 hover:text-[#56642b] transition-colors cursor-pointer">Lan Cattleya (Cattleya)</button></li>
                </ul>
              </div>
            </div>
            <a href="/#care-calculator" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors">
              Cách trồng và chăm sóc
            </a>
            <a href="/document" className="font-sans text-xs uppercase tracking-wider font-semibold text-[#434748] hover:text-[#56642b] transition-colors cursor-pointer">
              Tài liệu
            </a>
            <button className="font-sans text-xs uppercase tracking-wider font-semibold text-[#56642b] border-b-2 border-[#56642b] pb-1 transition-all cursor-pointer">
              Thảo luận
            </button>
          </div>
          <div className="flex items-center space-x-5">
            <button className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Tìm kiếm loài lan">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
            </button>
            <button onClick={() => window.location.href = '/login'} className="p-1.5 hover:bg-[#56642b]/5 text-[#56642b] rounded-full transition-colors cursor-pointer" title="Trang quản lý hồ sơ">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-5 h-5" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="w-full">
          <div className="max-w-[1000px] mx-auto pb-16 animate-fadeIn" id="community-main">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="community-grid">
        
        {/* Left Column Feed (66% space roughly) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Create Post Card */}
          <section className="bg-white border border-[#e2e3e1] rounded-lg p-5 luxury-shadow space-y-4" id="community-create-post">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#eeeeec] overflow-hidden flex-shrink-0 border border-[#e2e3e1]">
                <img 
                  src={USER_AVATAR} 
                  alt="My profile avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Chia sẻ hình ảnh hoa lan hoặc đặt câu hỏi của bạn..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-sans placeholder:text-[#747878] p-0 resize-none min-h-[70px] text-[#1a1c1b]"
                  id="post-textarea-input"
                  rows={3}
                />

                {/* Attached image preview */}
                {attachedImageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-[#e2e3e1] bg-[#eeeeec] max-h-80" id="post-image-preview-box">
                    <img 
                      src={attachedImageUrl} 
                      alt="Attached flower setup" 
                      className="w-full h-full object-contain max-h-76"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setAttachedImageUrl(null)}
                      className="absolute top-2.5 right-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                      title="Gỡ ảnh đính kèm"
                      aria-label="Remove attached image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Attachment option panel selector */}
                {showPhotoOptions && (
                  <div className="bg-[#f4f4f2] p-3 rounded border border-[#e2e3e1] space-y-3 animate-fadeIn" id="image-attachment-panel">
                    <div className="flex justify-between items-center border-b border-[#e2e3e1]/55 pb-1">
                      <span className="text-[10px] font-bold text-[#434748] uppercase tracking-wide">Đính kèm ảnh đoá hoa phong cách</span>
                      <button onClick={() => setShowPhotoOptions(false)} className="text-[#747878] hover:text-[#1a1c1b]">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PHOTO_ATTACH_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectPreloadedPhoto(opt.url)}
                          className="group border border-[#c4c7c7] rounded hover:border-[#56642b] overflow-hidden text-left bg-white transition-all text-[10px] flex gap-1.5 p-1 items-center"
                        >
                          <img src={opt.url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                          <span className="leading-tight text-[#434748] font-sans group-hover:text-[#56642b] truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="text-center pt-1 border-t border-[#e2e3e1]/40">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="font-sans text-[11px] text-[#56642b] hover:underline font-semibold"
                      >
                        Tải ảnh từ tệp tin của bạn...
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2.5 border-t border-[#f4f4f2]/80">
                  <button
                    onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                    className="flex items-center gap-2 text-[#56642b] hover:opacity-80 transition-all font-sans text-xs font-semibold py-1 select-none"
                    id="post-camera-attach-btn"
                  >
                    <Camera className="w-4.5 h-4.5" />
                    <span>Thêm ảnh</span>
                  </button>

                  <button
                    onClick={handleSubmitPost}
                    className="bg-[#56642b] hover:bg-[#5a682f] text-white px-5 py-1.5 rounded-full font-sans text-xs font-bold uppercase tracking-wider transition-all shadow active:scale-95 select-none cursor-pointer"
                    id="post-submit-btn"
                  >
                    Đăng bài
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Hashtag Filter Clear bar info */}
          {activeHashtagFilter && (
            <div className="bg-[#d6e7a0]/30 border border-[#56642b]/20 p-3 rounded flex justify-between items-center shadow-sm">
              <span className="font-sans text-xs text-[#5a682f]">
                Đang đối chiếu bài viết theo từ khoá: <strong className="font-semibold">{activeHashtagFilter}</strong>
              </span>
              <button
                onClick={() => setActiveHashtagFilter(null)}
                className="font-sans text-xs text-[#735c00] underline font-medium hover:text-[#56642b]"
                id="clear-hashtag-filter-btn"
              >
                Xem toàn bộ bài
              </button>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-6" id="community-posts-feed-list">
            {filteredPosts.map((post) => (
              <article 
                key={post.id}
                className="bg-white border border-[#e2e3e1] rounded-lg overflow-hidden luxury-shadow transition-all duration-300"
              >
                <div className="p-5.5">
                  {/* Post Header */}
                  <div className="flex justify-between items-start mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e2e3e1] bg-[#eeeeec]">
                        <img 
                          src={post.authorAvatar} 
                          alt={post.authorName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-sans text-xs font-bold text-[#1a1c1b] flex items-center gap-1">
                          {post.authorName}
                          {post.id.startsWith("post-") && !post.id.includes("post-1") && !post.id.includes("post-2") && (
                            <span className="inline-block bg-sky-100 text-sky-800 text-[8px] font-bold px-1 rounded uppercase">bạn</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-[#747878] font-sans">{post.timeAgo}</p>
                      </div>
                    </div>

                    {/* Delete option if user's post */}
                    {post.authorName.includes("Quỳnh Trần") && (
                      <button
                        onClick={(e) => handleDeletePost(post.id, e)}
                        className="text-[#747878] hover:text-[#ba1a1a] p-1 rounded-full transition-colors"
                        title="Gỡ chia sẻ"
                        aria-label={`Delete my post matching ${post.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="font-sans text-xs text-[#1a1c1b] leading-relaxed mb-3 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* HashTags embedded visually */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {post.tags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveHashtagFilter(tag)}
                          className="text-[10px] font-medium text-[#56642b] hover:underline"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Attached photo content */}
                  {post.imageSrc && (
                    <div className="rounded-lg overflow-hidden border border-[#eeeeec] mb-4 bg-[#f4f4f2] text-center">
                      <img 
                        src={post.imageSrc} 
                        alt="Shared orchid shot" 
                        className="w-full h-auto max-h-[440px] object-cover inline-block"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Actions Bar Liking and count comments */}
                  <div className="flex gap-6 py-2.5 border-y border-[#eeeeec] text-[#434748]">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors group select-none py-0.5 cursor-pointer ${
                        post.likedByCurrentUser ? "text-[#56642b] font-semibold" : "hover:text-[#56642b]"
                      }`}
                    >
                      <Heart 
                        className={`w-4 h-4 transition-transform group-active:scale-130 ${
                          post.likedByCurrentUser ? "fill-[#56642b]" : ""
                        }`} 
                      />
                      <span>Yêu thích ({post.likes})</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs py-0.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Ý kiến thảo luận ({post.comments.length})</span>
                    </div>
                  </div>

                  {/* Comments list nested */}
                  <div className="mt-4 space-y-3.5">
                    {post.comments.map((com) => (
                      <div key={com.id} className="flex gap-2.5 items-start">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#e2e3e1]">
                          <img 
                            src={com.authorAvatar} 
                            alt={com.authorName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 bg-[#f4f4f2] rounded-r-lg rounded-bl-lg px-3.5 py-2.5 space-y-0.5 text-left border border-[#eeeeec]">
                          <div className="flex justify-between items-center">
                            <strong className="text-[11px] font-sans font-bold text-[#1a1c1b]">{com.authorName}</strong>
                            <span className="text-[9px] text-[#747878] font-mono">{com.timestamp}</span>
                          </div>
                          <p className="font-sans text-xs text-[#434748] leading-relaxed">
                            {com.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Quick Add Comment field */}
                    <div className="flex gap-2.5 items-center pt-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#e2e3e1]">
                        <img 
                          src={USER_AVATAR} 
                          alt="Self avatar comment author" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex-1 flex items-center bg-[#f4f4f2] border border-[#e2e3e1] rounded-full px-3.5 py-1">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs({
                            ...commentInputs,
                            [post.id]: e.target.value
                          })}
                          onKeyPress={(e) => handleKeyPressComment(e, post.id)}
                          placeholder="Viết bình luận..."
                          className="bg-transparent border-none focus:ring-0 text-xs w-full py-1 text-[#1a1c1b]"
                        />

                        <button
                          onClick={() => handlePostComment(post.id)}
                          className="text-[#56642b] p-1 hover:scale-110 active:scale-95 transition-transform"
                          aria-label="Send reply comment"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </article>
            ))}

            {filteredPosts.length === 0 && (
              <div className="bg-white border border-[#e2e3e1] p-12 rounded-lg text-center">
                <Milestone className="w-8 h-8 text-[#747878] mx-auto mb-2" />
                <p className="font-sans text-sm text-[#434748]">Không thấy có thảo luận nào trùng hashtag này.</p>
                <button
                  onClick={() => setActiveHashtagFilter(null)}
                  className="mt-3 font-sans text-xs font-semibold text-[#56642b] underline"
                >
                  Đọc xem tất cả bài luận
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column Sidebar (34% space roughly) */}
        <aside className="md:col-span-4 space-y-6" id="community-sidebar">
          
          {/* Rules Card */}
          <section className="bg-white border border-[#e2e3e1] rounded-lg p-5.5 luxury-shadow space-y-4" id="rules-card">
            <h4 className="font-serif text-[15px] italic text-[#1a1c1b] border-b border-[#5a682f]/30 pb-2 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-[#56642b]" />
              <span>Quy tắc cộng đồng</span>
            </h4>
            
            <ul className="space-y-3.5 text-xs">
              <li className="flex gap-2 items-start text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-[#56642b] mt-1.5 flex-shrink-0" />
                <p className="font-sans text-[#434748]">
                  <strong className="text-[#1a1c1b] font-semibold">Tôn trọng:</strong> Luôn duy trì thái độ lịch thiệp, tôn kính nghệ nghệ thuật gia và tôn trọng đóng góp từ nghệ nhân khác.
                </p>
              </li>
              
              <li className="flex gap-2 items-start text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-[#56642b] mt-1.5 flex-shrink-0" />
                <p className="font-sans text-[#434748]">
                  <strong className="text-[#1a1c1b] font-semibold">Bảo tồn ranh giới:</strong> Nghiêm cấm bứt bẻ, rao vặt thu mua lan quý hiếm kiểu xâm phạm nguồn gen gốc của tổ quốc.
                </p>
              </li>

              <li className="flex gap-2 items-start text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-[#56642b] mt-1.5 flex-shrink-0" />
                <p className="font-sans text-[#434748]">
                  <strong className="text-[#1a1c1b] font-semibold">Phi thương mại:</strong> Tuyệt đối không đăng lặp rao bán hàng rong, các tin rác đại trà quấy nhiễu thưởng lãm.
                </p>
              </li>
            </ul>
          </section>

          {/* Active Members Card */}
          <section className="bg-white border border-[#e2e3e1] rounded-lg p-5.5 luxury-shadow space-y-4" id="members-card">
            <h4 className="font-serif text-[15px] italic text-[#1a1c1b] border-b border-[#5a682f]/30 pb-2 uppercase tracking-wider">
              Thành viên tích cực
            </h4>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e2e3e1] bg-[#eeeeec]">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdGE8tHYP0nPhlRFsRMGXjhxHYx3mAXgWiE8b_N024REdtq4-ESyLwVR1L9MkqANT56O6EeJJIknKHyU9O4K52lakZXBGJlWrfaKWGQ1_Dl2rsnFK8QfqvDSjWx0iD5838s1zMcL-iXWlOx_TIamqQ9GNql_tBsug0sQ57Vs2v-aciOwyzZaDaBG7tXcVjHEjMa0ySh_rDhh6n13Q9RjYlnFptxjh09tlo4bEXNe9lS8GM8D0S8HVxy5p9VY4umwXr0bwBMoBBg4y5"
                      alt="Hoàng Anh profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-sans text-xs font-semibold text-[#1a1c1b]">Hoàng Anh</span>
                </div>
                
                <span className="bg-[#d6e7a1] text-[#5a682f] text-[9px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                  <BadgeCheck className="w-2.5 h-2.5" />
                  Chuyên gia
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e2e3e1] bg-[#eeeeec]">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXLx_Z6JSSB4few-cga6SEWeBcitac9udwUbMSC1ET-VwD8QXKfNW70fehyIhwAMZbbqWVtzdQWkvjLo-hcEMXBJLGYpMLezhYeRETXzqL_c4lYgQ9ZPv1zB3QRlqrm9AXZRxmCpIGaf4WXNMlQGW_Srl_-rUfPuDoB-BAljPk1V7be-NRze4u_jR7sDpAC1kHtBV5gBJzfIQqdr_HpVagiW8KFGyBJlzyFGGXbNPFm7RGze0kv2-hocaH4vgc1QFzBiKXVD5aLfDA"
                      alt="Khánh Huyền profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-sans text-xs font-semibold text-[#1a1c1b]">Khánh Huyền</span>
                </div>
                
                <span className="bg-[#f4f4f2] text-[#434748] text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                  Tích cực
                </span>
              </div>
            </div>
          </section>

          {/* Hashtags Filter Sidebar */}
          <section className="bg-white border border-[#e2e3e1] rounded-lg p-5.5 luxury-shadow space-y-4" id="hashtags-card">
            <h4 className="font-serif text-[15px] italic text-[#1a1c1b] border-b border-[#5a682f]/30 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#735c00] fill-[#735c00]" />
              <span>Chủ đề Hot</span>
            </h4>

            <div className="flex flex-wrap gap-2 pt-1">
              {["#ChamSocLanHoDiep", "#LanRungVietNam", "#BaoTonThienNhien"].map((tag) => {
                const isActive = activeHashtagFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveHashtagFilter(isActive ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-sans transition-all border cursor-pointer select-none ${
                      isActive
                        ? "bg-[#56642b] border-[#56642b] text-white"
                        : "bg-[#f4f4f2] border-[#e2e3e1]/60 text-[#434748] hover:bg-[#56642b] hover:text-white hover:border-[#56642b]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            
            {activeHashtagFilter && (
              <button 
                onClick={() => setActiveHashtagFilter(null)}
                className="text-[10px] text-[#735c00] font-sans underline block text-left"
              >
                Đặt lại xem mọi chủ đề
              </button>
            )}
          </section>

        </aside>
      </div>
    </div>
        </div>
      </main>
    </div>
  );
}
