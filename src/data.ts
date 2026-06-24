/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Orchid, Question, Article, Category, CommunityPost , OrchidItem, PillarDetail, ResearchArticle, OrchidCareArticle, OrchidDocument } from './types';

export const INITIAL_ORCHIDS: Orchid[] = [
  {
    id: "orchid-1",
    name: "Cattleya Labiata",
    englishName: "Cattleya Lindl.",
    categoryIds: ["cat-1"],
    shortDescription: "Loài lan Cattleya cổ điển với những bông hoa màu đỏ tím lộng lẫy.",
    detailedDescription: "Một trong những loài lan Cattleya cổ điển với những bông hoa màu đỏ tím lộng lẫy và hương sắc quyến rũ, đại diện cho nét vương giả trong bộ sưu tập.",
    hasFragrance: true,
    isPopular: true,
    slug: "cattleya-labiata",
    uploadedImageIds: ["https://lh3.googleusercontent.com/aida/AP1WRLtTtnS65VcjE7BE31n6y5CeK_0J2DRVQcvXU4HlNMBxcfpDOW3aT76mDA56cmtNwXL_WmMQkT87iaHAkRCMT1K2d36dvOES_KWEWzfiBRIO90Pnmcu84A72t6BmJzd5lEwRazPS9IRjhMLExRWVo9vVZ7Ep1CcivILrBmqP6CG76r0kI1MRGGHSq6FzzhFvO9h5CTxf-PRMLiqwHFJCEuqfCElwpHgdu5PJPFCgnSHkHc0GFuOYThzmTPwP"],
    displayOrder: 1
  },
  {
    id: "orchid-2",
    name: "Lan Vũ Nữ Hoàng Hậu",
    englishName: "Oncidium altissimum",
    categoryIds: ["cat-3"],
    shortDescription: "Hoa lan Vũ Nữ Hoàng Hậu có sắc hoa vàng rực rỡ.",
    detailedDescription: "Hoa lan Vũ Nữ Hoàng Hậu có sắc hoa vàng rực rỡ, cánh hoa uốn lượn như vũ công đang nhảy múa trên nền tảng xanh mướt của thiên nhiên.",
    hasFragrance: false,
    isPopular: true,
    slug: "lan-vu-nu-hoang-hau",
    uploadedImageIds: ["https://lh3.googleusercontent.com/aida/AP1WRLtJTsse4QCP9lf4bVR5zJMChIWf2pzEyXOJlRQf2ocGVjs7ufKeIoK6e_pXQxHRhIJE7TO-K3QNOSUVoyTg0QnqZiTrtX8zdEtNxkmnsJ7ACUfaSM5nX994-acMmZU8YDbdV7VSBvdMZFeeJLaJghiqnql6qQiISw9IdIsEqlU-v31gg639QM3pjLJX2kaNvxQoSwag5XaRu19me0BWtth20WkjbtYqQd614Pp4C4lsd_6RJ7a2_rlIHTNm"],
    displayOrder: 2
  },
  {
    id: "orchid-3",
    name: "Dendrobium Nobile",
    englishName: "Dendrobium nobile Lindl.",
    categoryIds: ["cat-4"],
    shortDescription: "Lan Hoàng Thảo Dẹt hay Thạch Hộc, phong lan quý hiếm.",
    detailedDescription: "Lan Hoàng Thảo Dẹt hay Thạch Hộc, loài phong lan quý hiếm với các đốt thân dẹt đặc trưng, hoa có màu tím xen kẽ trắng tinh khiết thanh cao.",
    hasFragrance: true,
    isPopular: false,
    slug: "dendrobium-nobile",
    uploadedImageIds: ["https://lh3.googleusercontent.com/aida/AP1WRLs9UWwOOKykmjUK0vo6PHvn64CTFonRCmy-IwTey68h0e_xMVWSxLosK2dFy4uW_pSm6oiW_6nKtWoltBH_dE9EkR03QR635E2DPE6wYDMETStRUvLmsu-qtMnXbbolMpFtK5GjzOPs693t8pxtZFLAe31Sb7zvmsVKo32zauEDwv656NQ0G9n3K0_xuVy37y0DrWhit7SG74WSfsRGkvwNCiQLGVWBP7lHD-Mb2itSgkJeWUyo0SYvsfJc"],
    displayOrder: 3
  },
  {
    id: "orchid-4",
    name: "Lan Hồ Điệp Trắng Kinh Điển",
    englishName: "Phalaenopsis amabilis",
    categoryIds: ["cat-2"],
    shortDescription: "Vua của các loài lan Hồ Điệp bản địa rừng nhiệt đới.",
    detailedDescription: "Vua của các loài lan Hồ Điệp bản địa rừng nhiệt đới, cánh hoa tròn đầy đặn mang sắc trắng phủ sương sớm thanh mảnh quý phái.",
    hasFragrance: false,
    isPopular: true,
    slug: "lan-ho-diep-trang-kinh-dien",
    uploadedImageIds: ["https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p"],
    displayOrder: 4
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q-1",
    sender: "Minh Anh",
    avatarLetter: "M",
    avatarColor: "bg-secondary-fixed text-on-secondary-fixed",
    content: "Làm thế nào để Cattleya ra hoa đúng dịp Tết?",
    timeAgo: "10 phút trước",
    replied: false
  },
  {
    id: "q-2",
    sender: "Khánh Lê",
    avatarLetter: "K",
    avatarColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    content: "Lan bị vàng lá có phải do dư đạm không?",
    timeAgo: "45 phút trước",
    replied: false
  },
  {
    id: "q-3",
    sender: "Hoàng Nam",
    avatarLetter: "H",
    avatarColor: "bg-primary-fixed text-on-primary-fixed",
    content: "Xin danh sách các nhà vườn uy tín tại Đà Lạt.",
    timeAgo: "2 giờ trước",
    replied: false
  },
  {
    id: "q-4",
    sender: "Thu Hương",
    avatarLetter: "T",
    avatarColor: "bg-secondary-fixed text-on-secondary-fixed",
    content: "Nhiệt độ thích hợp cho Lan Hồ Điệp là bao nhiêu?",
    timeAgo: "5 giờ trước",
    replied: false
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Phân tích bảo tồn các giống Lan Rừng quý hiếm Việt Nam",
    category: "Bảo tồn",
    author: "Nguyễn Tài",
    content: "Nghiên cứu về các dòng Lan Phi Điệp rừng tự nhiên và sự thu hẹp môi trường sống do biến đổi khí hậu cũng như khai thác quá mức. Báo cáo kiến nghị xây dựng vườn ươm bảo trợ quốc gia.",
    readTime: "7 phút đọc",
    date: "18 Tháng 6, 2026",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p",
    status: "Published"
  },
  {
    id: "art-2",
    title: "Kỹ thuật bón phân hữu cơ sinh học tối ưu cho Cattleya Var",
    category: "Nhân giống",
    author: "Nguyễn Tài",
    content: "Việc sử dụng dịch chuối lên men bón trực tiếp vào rễ giúp lan Cattleya duy trì hệ gân chắc khỏe, thúc đẩy quá trình ra mắt tơ xanh mọng đặc thù.",
    readTime: "5 phút đọc",
    date: "12 Tháng 6, 2026",
    status: "Published"
  },
  {
    id: "art-3",
    title: "Nhiệt độ và chế độ tưới tiêu đạt chuẩn nông nghiệp Công nghệ cao",
    category: "Công nghệ",
    author: "Nguyễn Tài",
    content: "Áp dụng hệ thống cảm biến tự động tưới phun sương duy trì độ ẩm không khí đạt chuẩn 75-80% để nhân giống lan đột biến sọc hoặc khảm ngọc bích.",
    readTime: "12 phút đọc",
    date: "05 Tháng 6, 2026",
    status: "Draft"
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Cattleya",
    scientificName: "Cattleya Lindl.",
    description: "Chi lan lớn có hoa to, nổi bật và sống phụ sinh cực kỳ ưa chuộng bởi những dòng hoa lai đa màu rực rỡ.",
    orchidCount: 245
  },
  {
    id: "cat-2",
    name: "Oncidium",
    scientificName: "Oncidium Sw.",
    description: "Nhóm hoạn lan với các dải hoa xòe rộng rực rỡ như dải lụa vàng óng rạng ngời dưới nắng xuân.",
    orchidCount: 182
  },
  {
    id: "cat-3",
    name: "Dendrobium",
    scientificName: "Dendrobium Sw.",
    description: "Nhóm phong lan đa dạng thân đứng bám gỗ khô bản địa Đông Nam Á với sức sinh trưởng bền bỉ kỳ diệu.",
    orchidCount: 512
  },
  {
    id: "cat-4",
    name: "Phalaenopsis",
    scientificName: "Phalaenopsis Blume",
    description: "Chi lan Hồ điệp thanh nhã phổ biến trong vườn thượng uyển nhờ phong dáng đài các bền bỉ bất chấp thời tiết dông bão.",
    orchidCount: 309
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    author: "Nguyễn Tài",
    authorRole: "Quản trị tối cao",
    avatarLetter: "N",
    avatarColor: "bg-[#56642b] text-white",
    content: "Chào buổi sáng cộng đồng yêu lan! Hôm nay vườn tôi vừa xổ được một mặt hoa Cattleya đột biến rất đẹp. Cánh sáp dày, thơm nức mũi. Mọi người cùng chiêm ngưỡng nhé! 🌸✨",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p",
    likes: 24,
    likedByMe: true,
    timeAgo: "2 giờ trước",
    status: 'approved',
    comments: [
      {
        id: "cmt-1",
        author: "Minh Anh",
        avatarLetter: "M",
        avatarColor: "bg-secondary-fixed text-on-secondary-fixed",
        content: "Đẹp tuyệt vời bác ơi! Cho em hỏi bác dùng phân gì mà cánh căng vậy ạ?",
        timeAgo: "1 giờ trước"
      },
      {
        id: "cmt-2",
        author: "Khánh Lê",
        avatarLetter: "K",
        avatarColor: "bg-tertiary-fixed text-on-tertiary-fixed",
        content: "Màu xuất sắc quá, chúc mừng nhà vườn!",
        timeAgo: "30 phút trước"
      }
    ]
  },
  {
    id: "post-2",
    author: "Thu Hương",
    authorRole: "Thành viên tích cực",
    avatarLetter: "T",
    avatarColor: "bg-tertiary text-white",
    content: "Cả nhà cho em hỏi, chậu Hồ Điệp của em dạo này hay bị héo rễ dù em tưới rất đều đặn 2 ngày 1 lần. Có phải do giá thể bị mặn không ạ? Em đang dùng vỏ thông kết hợp dớn chi-lê. Mong các cao nhân chỉ giáo!",
    likes: 8,
    likedByMe: false,
    timeAgo: "5 giờ trước",
    status: 'approved',
    comments: [
      {
        id: "cmt-3",
        author: "Hoàng Nam",
        avatarLetter: "H",
        avatarColor: "bg-primary-fixed text-on-primary-fixed",
        content: "Bạn thử nhổ lên kiểm tra rễ xem có bị thối nhũn không nhé. Tưới nhiều quá đôi khi úng rễ đó.",
        timeAgo: "4 giờ trước"
      }
    ]
  },
  {
    id: "post-pending-1",
    author: "Khách vãng lai",
    authorRole: "Thành viên mới",
    avatarLetter: "K",
    avatarColor: "bg-error text-white",
    content: "Cho hỏi mua giống lan Phi Điệp ở đâu rẻ nhất vậy ạ? Mình mới chơi lan nên chưa biết nhiều.",
    likes: 0,
    likedByMe: false,
    timeAgo: "Vừa xong",
    status: 'pending',
    comments: []
  }
];



export const orchidData: OrchidItem[] = [
  {
    id: "lan-rung",
    name: "Lan Rừng Tự Nhiên",
    scientificName: "Dendrobium anosmum",
    vietnameseName: "Giả Hạc / Phi Điệp",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQD4nqk6sHzZeAJmX4LYXEKUH5kD633oM0h10QwLnXjYh69O1A5Vd0Ryw7k4v9D23i1XJSi140YoSV2rOE-39NRfqmMJPP6ym9VrJySM36FpiYz_mh_7PnwfZwyoALrXCWs0E1-IBsBgrur0G6QfBG4V9hWk_AJTfXn1WeYPczApIWaCOIFjPRNs-KkZADbXN4AsTCokutuoH9y1xH59SPNXkrPTTowVsCrSWhD5BQ6oaXByh6g5JzObn7pHX7GU-RkeZ4Z8FvQFOy",
    description: "Sức sống mãnh liệt từ những cánh rừng nguyên sinh, mang vẻ đẹp hoang dại và thuần khiết.",
    longDescription: "Lan Phi Điệp (hay còn gọi là Giả Hạc) thuộc chi Hoàng Thảo là loại lan rừng cực kỳ phổ biến và được yêu thích tại Việt Nam. Sinh trưởng bám trên các thân cây cổ thụ ở độ cao từ 300m đến 1500m, cây có thân thòng dài mềm mại, mang mùi thơm nồng nàn dịu ngọt như mật ong và sở hữu sức sống vô cùng bền vững qua các mùa khí hậu khắc nghiệt.",
    origin: "Rừng nhiệt đới ẩm Đông Nam Á, phân bố nhiều tại các vùng núi Tây Nguyên và Tây Bắc Việt Nam.",
    watering: "Tưới đậm khi giá thể khô hoàn toàn, trung bình 1-2 lần/ngày vào mùa sinh trưởng, giảm dần và ngưng hẳn khi cây đi vào mùa nghỉ (rụng lá).",
    light: "Ánh sáng tán xạ 60% - 70%. Tránh nắng trực tiếp buổi trưa để hạn chế cháy lá.",
    temperature: "15°C - 32°C. Có khả năng chịu lạnh tạm thời trong mùa nghỉ để kích thích nụ hoa.",
    fertilizer: "Sử dụng phân hữu cơ loãng (khuyên dùng bã trà dừa) dồi dào đạm vào mùa phát triển thân lá, chuyển sang lân và kali trước mùa hoa.",
    soilType: "Vỏ thông tự nhiên kết hợp dớn và rêu rừng để giữ ẩm ở mức tối ưu.",
    conservationStatus: "Sắp bị đe dọa (NT) do khai thác quá mức ngoài tự nhiên."
  },
  {
    id: "lan-dot-bien",
    name: "Lan Đột Biến",
    scientificName: "Phalaenopsis Variegata / Mutant",
    vietnameseName: "Hồ Điệp Phát Tài / Đột Biến Gen",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ4DL6rzqWGZWFJZgAKX6fTi6S6OXLGW-aFqWnONwIkG5fcqnRIB-Phudtq5tuuUApq2pCMHZKByJyhHKu2Z_naUQlx4IpKiwwH5NxQg02GqtACfU5TIUQwsKYdrC4G6exLCQL_um-aBY8YtEdSnPHpm1RvffND12HAPaUYxsNQn-w4BwZMEHH4NfO5Uku3_to2N9a7__3CEL4GSFKTpC9kYyMQMDTj9fUglhOeDDXDEMBVPQZgutaCQkNVTEV1t4zfhQwkFSAdSqC",
    description: "Những biến dị di truyền quý hiếm tạo nên những tác phẩm độc bản của tạo hóa.",
    longDescription: "Lan đột biến nổi bật với các bộ màu sắc cành lá độc đáo, vân lá sọc vàng đột biến (variegated) hoặc thay đổi cấu trúc cánh hoa phân ly di truyền sâu sắc. Mỗi cá thể đột biến bền vững là kết quả của sự xáo trộn nhiễm sắc thể ngẫu nhiên, vô cùng hiếm hoi trong hàng triệu hạt giống gieo tự nhiên.",
    origin: "Được tuyển chọn kỹ lưỡng từ các vườn nuôi cấy bảo tồn công nghệ cao kết hợp phát hiện ngoài thiên nhiên.",
    watering: "Yêu cầu tưới tinh khiết (nước lọc hoặc nước mưa), giữ ẩm đều tay nhưng tuyệt đối không để ướt sũng.",
    light: "Ánh sáng nhẹ 50%, tránh hoàn toàn nắng gắt làm xỉn màu vân đột biến quý giá trên bản lá.",
    temperature: "18°C - 28°C. Cần biên độ nhiệt ổn định để bảo vệ cấu trúc tế bào đột biến.",
    fertilizer: "Dinh dưỡng vi lượng cân bằng dạng phun sương định kỳ hàng tuần ở nồng độ cực loãng.",
    soilType: "Rêu trắng Chile nhập khẩu kết hợp vụn xơ dừa tiệt trùng.",
    conservationStatus: "Rất hiếm gặp, chủ yếu lưu trữ trong bảo tàng giống gen quý quốc gia."
  },
  {
    id: "lan-ho-diep",
    name: "Lan Hồ Điệp",
    scientificName: "Phalaenopsis amabilis",
    vietnameseName: "Hồ Điệp Trắng Thiên Sứ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB80GhyOVpmFdCryqVAGw820EnDh1uOxiFgoPXEU-PluSNrFYw3GN8sezZvxqp92dXQYPp1JMC4SgGFy67gZwexfHHloZHat4BDkO5Zd0AKnaGOtiSi2nwMl17ckvPsdoGgPeIlh3FZwTSme0rfkH_VGeEt7hL4PNi9KJZwNdJpjkE1Pe-PHKL5vYw8rinITUssobTzxEkwPkZX_xdGE2wZuAyQmTz-C6kVui-o79e5CFBvrqgtTcGmu3kE10BA5om-1eCkwUi_oY5V",
    description: "Biểu tượng của sự sang trọng, tinh tế và vẻ đẹp bền bỉ vượt thời gian.",
    longDescription: "Với các cành hoa uốn lượn mềm mại như đàn bướm trắng đang bay rập rờn, Lan Hồ Điệp là dòng lan hoàng gia biểu thị sự hoàn mỹ. Độ bền hoa kéo dài từ 2 đến 3 tháng đem lại giá trị thưởng lãm vượt bậc trong không gian nội thất đương đại đỉnh cao.",
    origin: "Các vùng đảo nhiệt đới gió mùa của Indonesia, Philippines và bờ biển Úc.",
    watering: "Chỉ tưới khi rễ chuyển sang màu xám bạc. Tưới trực tiếp vào gốc, tuyệt đối giữ khô các kẽ lá cấu trúc để tránh thối ngọn.",
    light: "Ánh sáng gián tiếp nhẹ qua rèm cửa (khoảng 1000 - 1500 fc). Rất thích hợp trang trí nội thất phòng khách tràn ngập ánh sáng tự nhiên.",
    temperature: "20°C - 30°C. Biên độ nhiệt độ ngày và đêm chênh lệch 6-8°C sẽ kích thích ra hoa mạnh mẽ.",
    fertilizer: "Phân bón NPK 20-20-20 định kỳ 2 tuần một lần để nuôi gốc vững chắc.",
    soilType: "Dớn trắng băm nhỏ kết hợp hạt đất nung nhẹ giữ ẩm tốt.",
    conservationStatus: "Ổn định nhờ công nghệ nhân giống invitro tiên tiến."
  },
  {
    id: "lan-cattleya",
    name: "Lan Cattleya",
    scientificName: "Cattleya labiata",
    vietnameseName: "Cát Lan / Nữ Hoàng Hoa Lan",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8BN0gaETHWt3LmNWBoO3dZ-TemqenTqVqDLKar1sAUC7n5Mc3ISev2uz94krVpsjoSee1qLhejU_o7tJizrxlKP02Xt7QfZyPRW2Uwyvtb7O1XcOHHml-B6QdR9Jqoo-rptBT7N3VLC5vc5xZ5C_wIGq93o7Y37JiivyKloEXlk6Il0z5YNQGZ7mch2sqSPRiHgTP7uTj5IJp8s4Kskzi3yUZmKiU5PbiDk7fnj8YgPNCAMtNUB9vawHi8x8NcXEqwN3s9GaD00OI",
    description: "Nữ hoàng của các loài lan với kích thước hoa đại bản và hương thơm quyến rũ đặc trưng.",
    longDescription: "Được mệnh danh là 'Nữ hoàng hoa lan' nhờ cấu trúc hoa to lớn kiều diễm vô song và môi hoa lượn sóng rực rỡ sắc màu. Cattleya toát ra mùi hương thuần khiết vô cùng quý phái quyến rũ vào mỗi buổi sớm mai, làm mê đắm giới sành chơi.",
    origin: "Các vùng núi cao râm mát Nam Mỹ, đặc biệt là Brazil, Colombia và Venezuela.",
    watering: "Thích khô thoáng rễ giữa những lần tưới. Đất quá sũng nước dễ làm thối củ bẹ dự trữ.",
    light: "Ánh sáng mạnh 70%. Khi lá có màu xanh ngả vàng nhẹ là lúc cây đạt đủ nắng để bung nụ.",
    temperature: "16°C - 35°C. Có khả năng chịu nhiệt độ cao cực kỳ tốt.",
    fertilizer: "NPK cân đối trong chu kỳ sinh trưởng, bổ sung giàu lân trước khi ra nụ.",
    soilType: "Vỏ thông lớn kết hợp than củi đập dập thông thoáng tối đa.",
    conservationStatus: "Bảo tồn nghiêm ngặt trong phụ lục CITES."
  }
];

export const pillarDetails: Record<string, PillarDetail> = {
  encyclopedia: {
    id: "encyclopedia",
    title: "Bách Khoa Toàn Thư Hoa Lan",
    description: "Không gian tra cứu khoa học toàn diện về phân loại thực vật học, sinh thái học bản địa của hàng nghìn chi lan quý trên thế giới.",
    items: [
      {
        name: "Phân loại chi loài (Orchidaceae Taxon)",
        description: "Hệ thống phân hóa của họ phong lan trải dài hơn 800 chi và 28,000 loài di truyền thuần chủng.",
        details: "Họ Lan (Orchidaceae) là một trong những họ lớn nhất của thực vật có hoa, phân bố hầu khắp các lục địa ngoại trừ sa mạc khô cằn và băng cực. Phân hữu cơ tự nhiên và kỹ thuật nuôi cấy là trọng tâm di truyền sinh học hiện đại."
      },
      {
        name: "Phân bố địa lý và Sinh thái học",
        description: "Bản đồ nhiệt độ ẩm và quần thể sinh thái nguyên sinh từ rừng rậm Amazon đến đại ngàn Tây Nguyên Việt Nam.",
        details: "Mỗi vùng khí hậu kiến tạo nên một đặc tính sinh trưởng sinh học riêng. Ví dụ, chi Dendrobium cần mùa đông khô lạnh để rụng lá ra hoa, trong khi chi Phalaenopsis từ các đảo nhiệt đới lại đòi hỏi độ ẩm cao ổn định quanh năm."
      },
      {
        name: "Đặc điểm hình thái học độc bản",
        description: "Phân tích cấu trúc rễ gió biểu bì (Velamen), thân giả hành trữ nước và cơ chế thụ phấn môi hoa tinh vi.",
        details: "Lớp màng velamen bọc xung quanh rễ lan có chức năng hấp thụ và tích trữ hơi nước cực nhanh từ không khí. Cánh môi lớn hoạt động như một bệ hạ cánh và định hướng khéo léo cho côn trùng thụ phấn."
      }
    ]
  },
  manual: {
    id: "manual",
    title: "Cẩm Nang Chuyên Gia Về Chăm Sóc",
    description: "Quy chuẩn kỹ thuật nuôi trồng lâm khoa kỹ lưỡng từ các nghệ nhân giàu kinh nghiệm, giúp người chơi sở hữu những tác phẩm hoa rực rỡ.",
    items: [
      {
        name: "Thiết kế giá thể và tiểu khí hậu",
        description: "Lựa chọn cấu trúc giữ ẩm, độ thông thoáng và thoát nước hoàn hảo cho từng hệ rễ khí sinh hay địa sinh.",
        details: "Giá thể lý tưởng không chỉ bám giữ gốc mà phải tái hiện cấu hình vỏ cây rừng nguyên sinh. Kết hợp vỏ thông New Zealand đã sấy tiệt trùng, xơ dừa cục và dớn cọng để bảo vệ rễ khỏi nấm bệnh."
      },
      {
        name: "Chu kỳ nước và Bí thuật bón phân",
        description: "Công thức kiểm soát độ ẩm, pH nước và định hướng dinh dưỡng tối ưu theo từng giai đoạn sinh trưởng khỏe mạnh.",
        details: "Tưới nước theo nguyên tắc 'Thấm đẫm nhưng ráo nhanh'. Nước tưới lý tưởng cần đạt pH từ 5.5 - 6.5. Bón phân loãng đều đặn giúp cây hấp thu liên tục mà không gây cháy rễ tích lũy muối."
      },
      {
        name: "Quản lý sâu bệnh chủ động",
        description: "Chẩn đoán sớm các loại nấm bệnh, nhện đỏ, thối nhũn do vi khuẩn và các biện pháp xử lý sinh học lành tính.",
        details: "Phòng bệnh bằng cách giữ vườn thông gió tuyệt đối và phun phòng nấm hữu cơ bằng vi sinh đối kháng vôi nông nghiệp trong mỗi mùa mưa dầm."
      }
    ]
  },
  library: {
    id: "library",
    title: "Thư Viện Tài Liệu Bảo Tồn & Nghiên Cứu",
    description: "Kho tàng các công trình khoa học, báo cáo bảo tồn học sinh học thực nghiệm giúp lưu trữ các nguồn gen quý giá khỏi nguy cơ tuyệt chủng.",
    items: [
      {
        name: "Bản tin khoa học giống gen quý",
        description: "Nghiên cứu nuôi cấy mô tế bào (In-vitro micropropagation) duy trì tính chất di truyền đặc hữu không lai tạp.",
        details: "Công nghệ nhân giống trong phòng thí nghiệm vô trùng cho phép sản xuất hàng loạt cây giống sạch bệnh từ các tế bào mô đỉnh sinh trưởng phục vụ cho các chương trình hoàn nguyên tự nhiên."
      },
      {
        name: "Chính sách bảo tồn và phục hồi tự nhiên",
        description: "Các văn bản quốc tế CITES bảo vệ đa sinh thái rừng rậm và quy chuẩn phối hợp vườn quốc gia.",
        details: "Bảo tồn bền vững đòi hỏi hành động nghiêm túc ngăn chặn nạn săn trộm phong lan rừng hoang dã song song với việc giáo dục cộng đồng địa phương cách canh tác nông nghiệp thân thiện môi trường."
      },
      {
        name: "Hợp tác quốc tế và Trao đổi học thuật",
        description: "Liên kết tri thức với các hiệp hội hoa lan quốc tế lớn tại Anh, Nhật Bản, Mỹ để cập nhật công nghệ lai tạo hàng đầu.",
        details: "Chia sẻ dữ liệu gen di truyền toàn cầu hỗ trợ nghiên cứu phân tử và phòng ngừa kịp thời cho các quần thể lan bản địa đang bị thu hẹp diện tích sinh sống."
      }
    ]
  }
};

export const researchArticles: ResearchArticle[] = [
  {
    id: "art-1",
    title: "Ứng dụng nuôi cấy mô tế bào đỉnh sinh trưởng trong tái nhân giống giống phong lan đặc hữu Việt Nam",
    author: "TS. Nguyễn Văn Hùng - Viện Khoa Học Lâm Nghiệp",
    publishedDate: "15/04/2025",
    category: "Nuôi cấy mô",
    summary: "Nghiên cứu chi tiết quy trình tách biệt mô phân sinh đỉnh sinh trưởng của giống Lan Hài hồng (Paphiopedilum delenatii) nhằm duy trì ổn định cấu trúc gen di truyền và nâng cao tỷ lệ sống của cây con sau khi đưa ra vườn ươm khí hậu tự nhiên.",
    content: "Nghiên cứu tiến hành thu thập mẫu cấy từ đỉnh sinh trưởng của chồi non Lan Hài hồng hoang dã. Khử trùng mẫu bằng sương hơi cồn 70 độ và dung dịch sút loãng. Môi trường MS (Murashige và Skoog) được bổ sung các chất điều hòa sinh trưởng auxin và cytokinins giúp tăng sinh mô sẹo protocorm vô trùng mạnh mẽ. Sau 12 tuần nuôi cấy lắc liên tục, tỷ lệ tái sinh chồi đạt 92.4%. Kết quả cho phép phục hồi hiệu quả nguồn gen quý có nguy cơ bị đe dọa cực kỳ nghiêm trọng trong Cẩm nang đỏ thực vật học."
  },
  {
    id: "art-2",
    title: "Phương pháp tạo dựng tiểu khí hậu tối ưu cho họ Lan Cattleya trong môi trường vườn kính đô thị",
    author: "ThS. Trần Thị Lan - Hiệp Hội Sinh Vật Cảnh Đô Thị",
    publishedDate: "28/05/2025",
    category: "Nuôi Trồng Lâm Khoa",
    summary: "Lắp đặt hạ tầng cảm biến và luồng gió đối lưu nhằm tái tạo chính xác độ cao và độ ẩm của các vách đá mát mẻ Nam Mỹ, nơi sinh rễ của những bông lan Cattleya khổng lồ đầy quyến rũ.",
    content: "Các đo đạc thực nghiệm cho thấy việc kiểm soát độ thông thoáng gió (vận tốc gió tuần hoàn từ 0.5 - 1.2 m/s) là yếu tố quyết định giúp củ giả hành Cattleya tích trữ dinh dưỡng mà không bị úng nhũn thối bẹ lá. Bố trí màn che di động điều khiển thông minh cảm biến ánh sáng giữ cường độ bức xạ trong khoảng 35,000 lux vào buổi sáng và hạ thấp vào buổi chiều kết hợp phun sương độ ẩm nền 75% giúp củ căng mập và hoa nở đúng chu kỳ Tết."
  },
  {
    id: "art-3",
    title: "Khảo sát đa dạng sinh học các loài phong lan chi Dendrobium tại Vườn Quốc Gia Phong Nha - Kẻ Bàng",
    author: "Đoàn khảo sát Sinh học Viện Sinh Thái và Tài Nguyên Sinh Vật",
    publishedDate: "12/01/2026",
    category: "Bảo Tồn Sinh Thái",
    summary: "Báo cáo thực địa ghi nhận thêm 8 chủng loại đặc hữu thuộc chi Hoàng Thảo và đánh giá tác động của biến đổi khí hậu toàn cầu đến mật độ phân bố tự nhiên bám cây giá thể rừng đá vôi.",
    content: "Qua 6 đợt khảo sát thu thập mẫu ngoài tự nhiên dọc theo các vách đá vôi dốc đứng và thung lũng ẩm ướt tại vùng lõi di sản thế giới Phong Nha - Kẻ Bàng, nhóm nghiên cứu đã lập danh lục định danh 42 loài Dendrobium. Đáng chú ý là việc phát hiện lại quần thể nhỏ Dendrobium khánh hòaense tưởng chừng đã biến mất. Đề xuất quy hoạch vùng bảo vệ nghiêm ngặt tránh sự xâm hại thô bạo của con người kết hợp lập ngân hàng gen cryopreservation đông lạnh phôi."
  }
];

export const preloadedChatResponses = [
  {
    keywords: ["tưới", "nước", "héo", "khô", "thối", "tuoi", "nuoc"],
    answer: "Họ phong lan hô hấp cực kỳ nhạy cảm qua rễ. Quy chuẩn hàng đầu là 'Thấm đẫm nhưng ráo nhanh'. Chỉ tưới khi bạn quan sát thấy rễ cây chuyển sang xám bạc hoặc giá thể đã khô ráo hoàn toàn. Tuyệt đối tránh tưới dồn dập dướí đáy chậu không sạch thoát nước khiến rễ bị nghẹt thở và thối rễ."
  },
  {
    keywords: ["ánh sáng", "nắng", "vàng lá", "cháy lá", "den", "anh sang", "nang"],
    answer: "Hầu hết hoa lan như Hồ Điệp, Vũ Nữ ưa ánh sáng tán xạ nhẹ (khoảng 60-70% ánh sáng tự nhiên qua lưới lọc hoặc rèm cửa). Nếu lá lan có màu xanh sẫm là thiếu nắng; xanh ngả vàng óng là vừa đủ nắng; còn vệt phấn trắng cháy xém khô giòn là biểu hiện cây đang bị cháy nắng nghiêm trọng, cần di dời ngay vào bóng mát."
  },
  {
    keywords: ["bón phân", "phân bón", "dinh dưỡng", "NPK", "bon phan", "dinh duong"],
    answer: "Nguyên tắc vàng của việc sử dụng phân bón cho lan là 'Bón thật loãng, bón đều tay'. Trong giai đoạn cây đang phát triển thân lá nảy mầm con, bạn chọn phân giàu đạm như NPK 30-10-10 hoặc phân hữu cơ loãng. Khi bẹ lá đã mập mạp và chuẩn bị ra mầm hoa, hãy đổi sang tỷ lệ lân và kali cao như NPK 10-30-30 hoặc 6-30-30 để kích ngọn nụ."
  },
  {
    keywords: ["đột biến", "var", "variegated", "dot bien"],
    answer: "Lan đột biến tự nhiên khảm lá sọc tài lộc hay đột biến sắc hoa cánh xoắn vô cùng quý giá. Để nuôi dòng này, bạn cần lắp đặt hệ thống lọc nước RO tinh khiết tránh nhiễm phèn mặn, giữ không khí thông thoáng nhẹ và cường độ ánh sáng dịu hơn dòng thông thường để tránh tổn thương sắc tố di truyền."
  },
  {
    keywords: ["giá thể", "đất", "vỏ thông", "chậu", "gia the", "dat"],
    answer: "Hoa phong lan đa số sống bám thân cây rừng gió mát (thuộc loài biểu sinh), do đó chúng KHÔNG trồng bằng đất thường. Hãy dùng vỏ thông đã tiệt trùng kỹ, xơ dừa cục, dớn mềm Chile hoặc than củi đập nhỏ giúp rễ luôn thông thoáng bám bọc thoải mái."
  }
];

export const defaultBotWelcome = "Kính chào Quý khách ghé thăm Orchids. Tôi là cố vấn nghiên cứu và kỹ thuật hoa lan tự động. Quý khách có thể đặt các câu hỏi về kỹ thuật trồng lan, chu kỳ tưới nước, cách bón phân khoa học, hay cách bảo tồn giống lan đột biến nhé!";
export const fallbackBotResponse = "Cảm ơn Quý khách đã chia sẻ câu hỏi về hoa lan. Nhằm cung cấp câu trả lời khoa học nhất, xin lưu ý các loài phong lan thường phát triển tốt khi giữ vững độ thoáng gốc, ánh sáng tán xạ dịu nhẹ và độ ẩm đều đặn. Bạn có cần cố vấn tư vấn sâu hơn về dòng Hồ Điệp, Cattleya, hay Lan Rừng tự nhiên cụ thể không?";


// --- Planting and Care Data ---



export const CARE_CATEGORIES = [
  "Tất cả bài viết",
  "Kỹ thuật tưới nước",
  "Bón phân & Dinh dưỡng",
  "Phòng trừ sâu bệnh",
  "Kích hoa nở"
] as const;

export const CARE_ARTICLES: OrchidCareArticle[] = [
  {
    id: "art-1",
    category: "Kỹ thuật",
    title: "Nghệ thuật tưới Lan Hồ Điệp trong mùa hanh khô",
    author: "Hoang Anh",
    date: "12 Oct 2024",
    description: "Tưới nước đúng cách không chỉ là cung cấp độ ẩm, mà còn là cách điều tiết nhịp sinh trưởng tự nhiên của loài hoa vương giả này...",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLt0sDmn8d7XgpVOxE_PZWa8RwyUBZD1TifM9kiqybla0xQIb8C87B6QtH5Ww9OGQixUJLRLm7fn-zeO1G8nLeCkeSq_B20v2N4AYwANLeCOtahvctMtYjnIUzvJcia7JaY7xgujgulisutp-qo6FwI147ja54Np22Niqq328vJjq407HGC1SJFhggJ42KlRG9XNHbJt1E_ErKR0m9UKyd09ltKX1vEkePnk2tjmbsGvrx0sZVmh0QQOXh1p",
    featured: true,
    content: `## Nghệ thuật tưới Lan Hồ Điệp trong mùa hanh khô

Lan Hồ Điệp (Phalaenopsis) được mệnh danh là nữ hoàng của thế giới hoa lan nhờ vẻ đẹp thanh tao và độ bền hoa kéo dài nhiều tháng. Tuy nhiên, khi khí hậu chuyển sang hanh khô mùa thu - đông, độ ẩm không khí giảm mạnh, độ ẩm không khí lý tưởng 60% rơi xuống dưới 40%, đây là thử thách lớn đối với người trồng lan.

Nếu tưới quá nhiều, rễ lan bị úng nước sẽ thối mục nhanh chóng. Nếu tưới thiếu, lá lan sẽ nhăn nheo, mất đi độ mọng nước tự nhiên và hoa nhanh rụng.

### 1. Quy tắc Vàng: "Khô Ướt Luân Phiên"
Không bao giờ tưới lan dựa theo số ngày cố định. Luôn áp dụng quy tắc kiểm tra giá thể trước khi tưới:
- **Kiểm tra rễ**: Rễ khỏe khi đủ nước sẽ có màu xanh lục sáng (green). Khi rễ chuyển sang màu xám bạc hoặc trắng, đó là thông điệp rực rỡ báo hiệu cây đang cần được bổ sung nước.
- **Dùng ngón tay hoặc que gỗ**: Cắm một que tre nhỏ sâu xuống chậu khoảng 3cm. Nếu que khô hoàn toàn, hãy tiến hành tưới. Nếu vẫn còn ẩm nhẹ, hãy lùi lịch lại 1 ngày.

### 2. Sử dụng nguồn nước thuần khiết
Rễ lan Hồ Điệp rất nhạy cảm với các loại hóa chất công nghiệp hoặc muối khoáng cao:
- **Nhiệt độ**: Luôn dùng nước có nhiệt độ bằng nhiệt độ phòng (khoảng 25-28°C). Việc dùng nước đá lạnh hoặc nước quá nóng sẽ gây sốc nhiệt đột ngột dẫn rụng nụ hoặc nấm đen xâm nhập.
- **Độ pH**: pH của nước tốt nhất trong khoảng 5.5 - 6.5. Hãy ưu tiên gom nước mưa tự nhiên hoặc dùng nước máy đã để lắng 24 giờ để bay bớt clo.

### 3. Kỹ thuật tưới chuẩn nghệ nhân
- **Tưới đẫm rồi để ráo**: Hãy dùng vòi phun sương mịn tưới toàn bộ giá thể cho đến khi nước chảy ra dưới đáy chậu. Đợi 10 phút, tưới lại một lần nữa để toàn bộ vỏ thông hoặc dớn ngậm đủ nước.
- **Tránh đọng nước tại nách lá**: Đây là sai lầm phổ biến nhất của người mới trồng. Nếu nước đọng lại ở kẽ lá hoặc ngọn lan qua đêm, vi khuẩn thối nhũn (Erwinia) sẽ phá hủy ngọn lan chỉ trong 24 giờ. Nếu lỡ làm đọng nước, hãy dùng khăn giấy tăm bông thấm khô ngay lập tức.`
  },
  {
    id: "art-2",
    category: "Dinh dưỡng",
    title: "Phân bón hữu cơ: Lựa chọn bền vững cho Lan Vũ Nữ",
    author: "Minh Tu",
    date: "08 Oct 2024",
    description: "Tận dụng những nguyên liệu tự nhiên sẵn có để tạo ra nguồn dinh dưỡng dồi dào, giúp cây phát triển rễ khỏe và lá xanh bóng...",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLtJTsse4QCP9lf4bVR5zJMChIWf2pzEyXOJlRQf2ocGVjs7ufKeIoK6e_pXQxHRhIJE7TO-K3QNOSUVoyTg0QnqZiTrtX8zdEtNxkmnsJ7ACUfaSM5nX994-acMmZU8YDbdV7VSBvdMZFeeJLaJghiqnql6qQiISw9IdIsEqlU-v31gg639QM3pjLJX2kaNvxQoSwag5XaRu19me0BWtth20WkjbtYqQd614Pp4C4lsd_6RJ7a2_rlIHTNm",
    featured: true,
    content: `## Phân bón hữu cơ: Lựa chọn bền vững cho Lan Vũ Nữ

Lan Vũ Nữ (Oncidium) sở hữu vẻ đẹp kiêu sa rực rỡ với hàng trăm đóa hoa vàng nhỏ như những vũ công nhảy múa trong gió ban mai. Đặc điểm của dòng lan này là phát triển rễ chùm mảnh khảnh và giả hành giả tròn trữ nước mạnh mẽ.

Sử dụng phân bón hóa học nồng độ cao liên tục rất dễ làm cháy các đầu rễ tơ của Vũ Nữ. Giải pháp tối ưu chính là ứng dụng các công thức phân bón hữu cơ tự nhiên thanh sạch, dịu nhẹ.

### 1. Dịch chuối - Thần dược chứa Kali tự nhiên
Dịch chuối lên men tự nhiên chứa hàm lượng Kali cực tốt giúp cành hoa Vũ Nữ vươn dài, chắc khỏe và sắc màu của hoa đậm nét, sắc sảo.
- **Cách làm**: Nấu chín 1kg chuối chín thái lát với 3 lít nước sạch trong 20 phút. Để nguội rồi xay nhuyễn, lọc lấy nước trong. Pha loãng 1 lít nước dịch chuối này với 10 lít nước sạch để phun định kỳ 1 lần/tuần.

### 2. Nước vo gạo - Kích thích bộ rễ phát triển thần tốc
Nước vo gạo chứa nhiều vitamin nhóm B (đặc biệt là B1) và protein hòa tan tự nhiên giúp kích thích các đâm nhánh rễ mới.
- **Kỹ thuật tưới**: Lấy phần nước vo gạo sạch (để lắng bụi cám to lắng xuống), tưới trực tiếp vào gốc lan vào sáng sớm. Phun nước gạo đều đặn giúp giả hành Vũ Nữ căng tròn bóng mẩy mà không sợ thối nhũn.

### 3. Lưu ý quan trọng khi bón phân cho Vũ Nữ
- **Tưới nước làm mát trước**: Luôn phun sương nhẹ qua chậu cây 15 phút trước khi tưới phân hữu cơ giúp rễ mềm ra, tăng khả năng thẩm thấu chất dinh dưỡng.
- **Nguyên tắc "Phân loãng tưới thường xuyên"**: Lan ăn rất ít như một kẻ ẩm thực thanh tao. Hãy pha loãng dung dịch gấp 2-3 lần so với công thức thông thường và tưới đều đặn để cây hấp thụ trọn vẹn.`
  },
  {
    id: "art-3",
    category: "Phòng bệnh",
    title: "Nhận biết sớm các loại nấm bệnh trên dòng Cattleya",
    author: "Lan Khue",
    date: "05 Oct 2024",
    description: "Những dấu hiệu nhỏ nhất trên phiến lá có thể cảnh báo nguy cơ bệnh dịch. Hãy cùng tìm hiểu cách phòng ngừa hiệu quả nhất...",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLtTtnS65VcjE7BE31n6y5CeK_0J2DRVQcvXU4HlNMBxcfpDOW3aT76mDA56cmtNwXL_WmMQkT87iaHAkRCMT1K2d36dvOES_KWEWzfiBRIO90Pnmcu84A72t6BmJzd5lEwRazPS9IRjhMLExRWVo9vVZ7Ep1CcivILrBmqP6CG76r0kI1MRGGHSq6FzzhFvO9h5CTxf-PRMLiqwHFJCEuqfCElwpHgdu5PJPFCgnSHkHc0GFuOYThzmTPwP",
    featured: false,
    content: `## Nhận biết sớm các loại nấm bệnh trên dòng Cattleya

Cattleya thường được ví như "Đại Hoàng Đế" của các loài lan nhờ những đóa hoa khổng lồ, hương thơm ngào ngạt vương giả tuyệt diệu. Thân và bẹ lá của Cattleya rất dày, dai để giữ nước ẩm. 

Tuy nhiên, vào thời điểm giao mùa ẩm thấp, lượng mưa không đều hoặc môi trường kém thông gió, Cattleya trở thành mục tiêu ưa thích của các loại nấm bệnh.

### 1. Bệnh Thối Đen (Black Rot) do nấm Phytophthora
Đây là căn bệnh nguy hiểm và lây lan nhanh nhất trên dòng lan Cattleya:
- **Triệu chứng**: Ban đầu xuất hiện một đốm nhỏ sũng nước màu nâu sẫm trên lá hoặc giả hành. Trong 24-48 giờ, đốm này chuyển sang màu đen kịt, sờ vào thấy mềm xẹp và có mùi hôi hám khó chịu.
- **Xử lý nhanh**: Ngay lập tức dùng dao sắc đã được hơ nóng khử trùng để cắt bỏ toàn bộ phần lá thối đen, lấn sâu vào mô khỏe khoảng 2cm. Thoa keo liền sẹo hoặc bột quế tự nhiên để sấy khô vết cắt. Di chuyển chậu lan ra vùng cách ly biệt lập.

### 2. Bệnh Thán Thư (Anthracnose)
Bệnh do nấm Colletotrichum gây ra, thường tấn công các cây lan đang bị suy nhược dinh dưỡng:
- **Triệu chứng**: Xuất hiện các vết lõm tròn màu nâu nhạt hoặc nâu đậm có các vòng tròn đồng tâm xếp khít nhau trên bản lá. Vết bệnh khô ráo và giòn dần.
- **Khắc phục**: Gom toàn bộ rác lá rụng, cắt bỏ vùng bệnh. Phun xịt các loại thuốc gốc Đồng (Copper) hoặc thuốc trị nấm hữu cơ thân thiện như bổ sung trichoderma sinh học vào giá thể.

### 3. Các bước vệ sinh phòng ngừa tinh tế
Vườn lan quý phái cần được sắp xếp hợp lý:
- **Độ thông gió tối đa**: Hãy treo giò lan Cattleya cách nhau ít nhất 40cm. Bộ lá khô nhanh sau khi tưới là lá chắn phòng nấm hữu hiệu nhất.
- **Khử trùng dụng cụ**: Luôn dùng cồn 90 độ lau sạch kéo cắt tỉa tế bào thực vật trước khi di chuyển từ chậu lan này sang chậu lan khác để tránh lây nhiễm chéo virus thực vật.`
  },
  {
    id: "art-4",
    category: "Mẹo vặt",
    title: "Cách kích thích Dendrobium ra hoa đồng loạt",
    author: "Admin",
    date: "01 Oct 2024",
    description: "Điều chỉnh nhiệt độ và ánh sáng trong giai đoạn then chốt để có những chùm hoa rực rỡ, khoe sắc bền lâu trong không gian sống...",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs9UWwOOKykmjUK0vo6PHvn64CTFonRCmy-IwTey68h0e_xMVWSxLosK2dFy4uW_pSm6oiW_6nKtWoltBH_dE9EkR03QR635E2DPE6wYDMETStRUvLmsu-qtMnXbbolMpFtK5GjzOPs693t8pxtZFLAe31Sb7zvmsVKo32zauEDwv656NQ0G9n3K0_xuVy37y0DrWhit7SG74WSfsRGkvwNCiQLGVWBP7lHD-Mb2itSgkJeWUyo0SYvsfJc",
    featured: false,
    content: `## Cách kích thích Dendrobium ra hoa đồng loạt

Dòng Hoàng Thảo Dendrobium là biểu tượng của tinh thần bền bỉ dẻo dai với khả năng thích ứng cao, siêng hoa và đa dạng sắc màu. Để một giò Dendrobium bung nở đồng loạt hàng chục cành hoa rạng rỡ vào đúng dịp mong muốn (như Lễ, Tết hoặc các buổi trưng bày), bạn cần nắm vững bí quyết điều phối nhiệt độ và dinh dưỡng của các nghệ nhân cổ điển.

### 1. Bí quyết "Cắt nước" tạo sốc sinh học
Khi cây Dendrobium đạt độ trưởng thành lý tưởng (đứng ngọn, lá ngọn thuôn nhỏ căng tròn và không còn nảy thêm chồi non mới ở gốc):
- **Cắt nước hoàn toàn**: Khoảng 3-4 tuần ngưng tưới hoàn toàn. Để cây chịu khô héo nhẹ nhằm báo hiệu cho cơ thể thực vật chuyển hướng sinh trưởng sinh dưỡng sang hướng sinh sản tạo nụ hoa.
- **Tiếp xúc ánh sáng mạnh**: Trong giai đoạn siết nước này, hãy treo cây ở khu vực nhận nhiều nắng nhất (khoảng 70% ánh sáng tán xạ). Ánh nắng sẽ xúc tác tổng hợp chất điều hòa hoa nở.

### 2. Sự chênh lệch nhiệt độ ngày/đêm kì diệu
Quá trình phân hóa mầm hoa cần xúc tác vật lý rất mạnh mẽ:
- Hãy chọn thời gian có sự chênh lệch nhiệt độ giữa ngày và đêm rõ rệt (khoảng 8 đến 10 độ C).
- Việc hạ nhiệt độ ban đêm xuống dưới 20 độ C sẽ thúc đẩy các mắt ngủ trên thân giò Dendrobium nứt nanh nụ một cách đồng đều đến kinh ngạc.

### 3. Công thức phân bón thúc hoa vương giả
- Sử dụng phân bón giàu Lân và Kali với tỷ lệ vượt trội như **NPK 6-30-30** hoặc **10-52-10**.
- Pha loãng 1g phân bón cùng 2 lít nước, phun đều hai mặt lá và rễ vào buổi sáng sớm, thực hiện đều đặn 4-5 ngày một lần trong suốt tháng kích bông. Khi các mắt nụ nhú đầu tăm tròn trịa, lập tức chuyển về công thức phân cân bằng dưỡng nụ rực rỡ.`
  }
];

export const HIGHLIGHTED_STATIONERY_QUOTES = [
  "Thấu hiểu tiếng nói của cỏ cây là nấc thanh tao bậc nhất của tâm hồn tri thức thượng lưu.",
  "Một đóa phong lan rạng rỡ không chỉ nở bằng dưỡng chất, nó nở bằng sự nhẫn nại thanh khiết của một đôi bàn tay trân quý nghệ thuật.",
  "Mỗi chiếc lá nhành hoa đều phản chiếu trọn vẹn sự chu toàn lắng sâu của gia chủ."
];



export const DOCUMENTS: OrchidDocument[] = [
  {
    id: 'lan-hai-dong-nam-a',
    title: 'Phân tích Hình thái học và Bảo tồn các loài Lan Hài (Paphiopedilum) tại khu vực Đông Nam Á',
    category: 'Nghiên cứu khoa học',
    categoryLabel: 'Nghiên cứu',
    format: 'PDF',
    author: 'TS. Nguyễn Hoàng Nam',
    year: 2023,
    size: '12.4 MB',
    pages: 48,
    views: 2480,
    downloads: 342,
    publisher: 'Viện Thực vật học Luxe',
    description: 'Nghiên cứu này trình bày một cái nhìn toàn diện về đặc điểm hình thái học của chi Paphiopedilum, tập trung vào các loài đặc hữu tại vùng núi cao Đông Nam Á. Chúng tôi phân tích sự biến đổi của cấu trúc hoa dưới tác động của biến đổi khí hậu.',
    summary: 'Nghiên cứu này trình bày một cái nhìn toàn diện về đặc điểm hình thái học của chi Paphiopedilum, tập trung vào các loài đặc hữu tại vùng núi cao Đông Nam Á. Chúng tôi phân tích sự biến đổi của cấu trúc hoa dưới tác động của biến đổi khí hậu và đề xuất các chiến lược bảo tồn ex-situ kết hợp với công nghệ gen để duy trì đa dạng sinh học cho các loài lan quý hiếm này.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMhRTUHOpHfijClJqk-oALzGRD439QJk5TBl9-CKNR_lkPYHOCEiAYKP9cnSHDiTCUV8vV2clxa9_p4Zfcr8ifPLjsOa1-u_CGtsesvIIaUj04Lf7-CFL5OGwUQatCR6rgdQm2IVK1FL9L_u-EOsKVV0CMo6NYzHKYQ9NbzE-0Vid8wEUZUNTt3bcgnfsiaACv394qbJJlOBEHFqYimYIhY_HlDZEHQLNo7Wqz9CS44QrXcxv_a62z4cwsrNRG6eBLwj40El1proYA',
    imageAlt: 'A high-quality macro photograph of a Paphiopedilum orchid in a professional botanical conservatory setting.',
    sections: [
      { title: '1. Giới thiệu về Chi Lan Hài (Paphiopedilum)', page: '04' },
      { title: '2. Đặc điểm hình thái học cơ bản', page: '12' },
      { title: '3. Phân bố địa lý và Sinh thái học', page: '21' },
      { title: '4. Thách thức trong công tác bảo tồn', page: '35' },
      { title: '5. Kết luận và Kiến nghị', page: '44' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Giới thiệu về Chi Lan Hài',
      },
      {
        type: 'paragraph',
        text: 'Lan Hài (Paphiopedilum) là một trong những nhóm thực vật thu hút sự quan tâm lớn nhất từ cả các nhà khoa học lẫn những người đam mê thực vật cảnh trên toàn thế giới. Với cấu trúc môi hoa đặc biệt hình chiếc túi (tương tự như mũi hài), chúng đã tiến hóa để tối ưu hóa quá trình thụ phấn thông qua cơ chế bẫy côn trùng độc đáo.',
      },
      {
        type: 'subheading',
        text: 'Sự đa dạng về loài',
      },
      {
        type: 'paragraph',
        text: 'Hiện nay, có khoảng hơn 80 loài được công nhận chính thức, phân bố chủ yếu từ vùng thấp của Ấn Độ đến các đảo ở Thái Bình Dương. Tại Việt Nam, nhiều loài đặc hữu quý hiếm như Paphiopedilum vietnamense hay Paphiopedilum helenae đang đứng trước nguy cơ tuyệt chủng cao do khai thác quá mức.',
      },
      {
        type: 'heading',
        text: '2. Đặc điểm hình thái học cơ bản',
      },
      {
        type: 'paragraph',
        text: 'Hình thái của Lan Hài được xác định bởi ba yếu tố chính: lá, thân và cấu trúc hoa phức hợp.',
      },
      {
        type: 'list',
        items: [
          'Lá: Thường có dạng thuôn dài, một số loài có vân mây (mottled leaves) tinh tế.',
          'Cánh đài (Sepals): Cánh đài lưng thường lớn và có màu sắc sặc sỡ để thu hút.',
          'Môi (Labellum): Hình túi sâu, bề mặt bên trong trơn trượt để giữ chân côn trùng.',
        ],
      },
      {
        type: 'image',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMhRTUHOpHfijClJqk-oALzGRD439QJk5TBl9-CKNR_lkPYHOCEiAYKP9cnSHDiTCUV8vV2clxa9_p4Zfcr8ifPLjsOa1-u_CGtsesvIIaUj04Lf7-CFL5OGwUQatCR6rgdQm2IVK1FL9L_u-EOsKVV0CMo6NYzHKYQ9NbzE-0Vid8wEUZUNTt3bcgnfsiaACv394qbJJlOBEHFqYimYIhY_HlDZEHQLNo7Wqz9CS44QrXcxv_a62z4cwsrNRG6eBLwj40El1proYA',
        caption: 'Hình 1.1: Cấu trúc cận cảnh của loài Paphiopedilum Rothchildianum tại vườn thực vật Orchidée Luxe.',
      },
      {
        type: 'subheading',
        text: 'Cơ chế thụ phấn đặc thù',
      },
      {
        type: 'paragraph',
        text: 'Không giống như các loại lan khác cung cấp mật hoa, Lan Hài sử dụng "chiêu trò thị giác" và mùi hương để đánh lừa côn trùng. Khi côn trùng rơi vào túi môi, lối thoát duy nhất là đi qua một khe hẹp nằm ngay dưới khối phấn, đảm bảo rằng hạt phấn sẽ dính chặt vào lưng sinh vật trước khi nó thoát ra ngoài.',
      },
    ],
  },
  {
    id: 'nhan-giong-ho-diep',
    title: 'Kỹ thuật nhân giống Lan Hồ Điệp trong phòng thí nghiệm',
    category: 'Nghiên cứu khoa học',
    categoryLabel: 'Nghiên cứu',
    format: 'PDF',
    author: 'TS. Nguyễn Văn A',
    year: 2023,
    size: '4.2 MB',
    pages: 32,
    views: 1850,
    downloads: 512,
    publisher: 'Nhà xuất bản Nông Nghiệp',
    description: 'Nghiên cứu chi tiết về phương pháp nuôi cấy mô tế bào cho giống Lan Hồ Điệp (Phalaenopsis), tập trung vào việc tối ưu hóa môi trường dinh dưỡng và điều kiện ánh sáng để tăng tỷ lệ sống sót của cây con...',
    summary: 'Nghiên cứu này đề cập chi tiết đến phương pháp kỹ thuật nuôi cấy mô tế bào (in-vitro) phục vụ nhân giống Lan Hồ Điệp (Phalaenopsis) quy mô công nghiệp. Tập trung vào việc thử nghiệm các công thức dinh dưỡng MS cải tiến, chất điều hòa sinh trưởng, cường độ ánh sáng và nhiệt độ phòng cấy thích hợp.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-Lp2REc_6pvjhIMc0RmFbhLEALxh4LyQaOWGfd4uwik8rAXF40yTal2J1Y4F_DDDc2IDZCMPZBIIkDBWsc39obDBLudnypUNdy3DphHgmJLrv9I2VfDYq-k6EFGdFCfuuqnwoYOclluDPkBqn1J2HWXL7bQ3gODJniSPm0i_ngSxxKtlvRFb5dJWmbemMyi7qY_F1QHpp0iaYhmx_Cpc9OOqml_mI2Cfdt9FvHB4rKL-fDSW2r-ASfVhHU6jTPt9yTgtxKUyjG0u8',
    imageAlt: 'A minimalist, editorial-style book cover with an elegant white orchid silhouette.',
    sections: [
      { title: '1. Đặt vấn đề và Mục tiêu nghiên cứu', page: '02' },
      { title: '2. Nguyên liệu và Phương pháp nhân giống in-vitro', page: '08' },
      { title: '3. Kết quả tối ưu hóa môi trường dinh dưỡng', page: '15' },
      { title: '4. Giai đoạn ra chai và chăm sóc cây con ngoài vườn ươm', page: '24' },
      { title: '5. Thảo luận và Kết luận chuyên môn', page: '30' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Đặt vấn đề và Mục tiêu nghiên cứu',
      },
      {
        type: 'paragraph',
        text: 'Lan Hồ Điệp (Phalaenopsis) là một trong những loài lan thương mại có giá trị kinh tế cao nhất trên thị trường hoa cây cảnh toàn cầu. Tuy nhiên, việc nhân giống bằng hạt trong tự nhiên gặp nhiều hạn chế do hạt lan không có nội nhũ. Do đó, kỹ thuật nuôi cấy mô tế bào thực vật (in-vitro propagation) là giải pháp tối ưu giúp sản xuất đồng loạt cây con sạch bệnh, giữ nguyên đặc tính di truyền tốt của cây mẹ.',
      },
      {
        type: 'subheading',
        text: 'Môi trường cấy mẫu ban đầu',
      },
      {
        type: 'paragraph',
        text: 'Nghiên cứu sử dụng mẫu cấy là chồi ngủ từ ngồng hoa để tiến hành khử trùng và kích thích tái sinh chồi. Kết quả thử nghiệm cho thấy việc kết hợp nồng độ cồn và dung dịch khử trùng canxi hypoclorit giúp đạt tỷ lệ mẫu sạch lên đến 85%.',
      },
      {
        type: 'heading',
        text: '2. Nguyên liệu và Phương pháp',
      },
      {
        type: 'paragraph',
        text: 'Các thí nghiệm được bố trí theo khối ngẫu nhiên hoàn toàn với 3 lần lặp lại. Môi trường nền cơ bản sử dụng là môi trường Murashige & Skoog (MS) bổ sung các loại đường saccharose, thạch và các nồng độ chất kích thích sinh trưởng auxin, cytokinin thích hợp.',
      },
    ],
  },
  {
    id: 'cham-soc-lan-dot-bien',
    title: 'Sổ tay hướng dẫn chăm sóc Lan đột biến dành cho người mới',
    category: 'Sách hướng dẫn',
    categoryLabel: 'Hướng dẫn',
    format: 'DOCX',
    author: 'KS. Trần Thị B',
    year: 2022,
    size: '1.8 MB',
    pages: 25,
    views: 3120,
    downloads: 840,
    publisher: 'Hội Sinh Vật Cảnh Việt Nam',
    description: 'Tổng hợp các kỹ năng cơ bản về bón phân, tưới nước và kiểm soát sâu bệnh cho các dòng Lan Var quý hiếm. Tài liệu trình bày dưới dạng infographic dễ hiểu...',
    summary: 'Sổ tay bỏ túi trực quan hóa toàn bộ quy trình từ khâu chọn giống, làm giàn treo, kiểm soát nhiệt độ, độ ẩm đến việc điều phối vi lượng dinh dưỡng đặc thù cho các giống lan phi điệp đột biến và lan quý hiếm khác, giúp người mới bắt đầu tránh những sai lầm phổ biến gây thối rễ, rụng lá.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuJM0CxcCUrpscErUyaPuvD2ZAkEEgoIXGAtcDHOhLAVd3Po-NSKjqfGyFLny_5ohDloZZ8vU5ysuFn13DK8_LGFsQqybCXC8_B2hzm_M2vnHwiHtNn6RPXInrXbQJyBltgEUcx3BfB67Pl7QnqRIB4DL8XBc7wSJRVLAPQ872RA4m63SeEvk6w6Dn-f1xmv3pyXF5oeUtOPmAQ13foF4KRI2c-FYZ5DqhzFItlt1czzfUFpY2QKvH8yDI4s7DaStZn43JErA1mgTA',
    imageAlt: 'A beautiful booklet preview with elegant foliage patterns on a clean minimalist page.',
    sections: [
      { title: '1. Nhận biết các dòng Lan Var phổ biến', page: '03' },
      { title: '2. Thiết kế giàn treo và tối ưu vi khí hậu', page: '07' },
      { title: '3. Chế độ tưới nước và dinh dưỡng phân bón theo mùa', page: '12' },
      { title: '4. Phòng ngừa và điều trị thối nhũn, côn trùng gây hại', page: '19' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Thiết lập vườn trồng tối ưu',
      },
      {
        type: 'paragraph',
        text: 'Lan đột biến, đặc biệt là các dòng phi điệp 5 cánh trắng (5CT), rất nhạy cảm với sự thay đổi của môi trường. Một giàn lan tiêu chuẩn cần bảo đảm độ thông thoáng cao, có lưới che giảm nắng từ 50-60%, tránh hướng gió lùa quá mạnh nhưng không được bí bách.',
      },
    ],
  },
  {
    id: 'doi-soat-lan-hai',
    title: 'Bảng đối soát thông số môi trường tối ưu cho chi Lan Hài',
    category: 'Tài liệu nội bộ',
    categoryLabel: 'Kỹ thuật',
    format: 'XLSX',
    author: 'Orchid Research Group',
    year: 2024,
    size: '0.5 MB',
    pages: 12,
    views: 1240,
    downloads: 290,
    publisher: 'Orchidée Luxe Research',
    description: 'Dữ liệu tổng hợp từ các trạm quan trắc, cung cấp chỉ số pH, độ ẩm, và cường độ ánh sáng lý tưởng cho từng giai đoạn phát triển của Paphiopedilum...',
    summary: 'Bảng tra cứu số liệu kỹ thuật tổng hợp từ các cảm biến quan trắc vi khí hậu tự động tại các khu bảo tồn và vườn ươm thực nghiệm. Cung cấp ngưỡng tối ưu chi tiết về nhiệt độ ngày/đêm, độ ẩm tương đối, chỉ số pH giá thể và cường độ ánh sáng Lux phù hợp nhất cho 45 loài Lan Hài Đông Nam Á.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEZM_bRksmVOYXCwuQj2JHBg-TD3QGwPlAq0_DNkKEIwHsLdSusTes-DAtvRsE54Gny250aGoeh-PxYD0TdaM3QRKp2Xgq326KNz-WYqFkW6bRpkMX2Kww5i--wdbk9YfR1_wfZ-Ouf35gM2bZ4zmcreUOc2BGjAueu7NpUUWKC6nJlf0INiMUsv04AID35SpM5aA3P18tZPp7xxrzPagaSnwo4ONpAdVyZukisA3LoxlBKhMsQ-2lY5rvyz_cgnC02Xdz8MiIaOFx',
    imageAlt: 'A dried orchid specimen mounted on a warm vintage background with scientific notes.',
    sections: [
      { title: '1. Hướng dẫn sử dụng bảng tra cứu số liệu', page: '01' },
      { title: '2. Thông số tối ưu cho nhóm Lan Hài chịu lạnh (núi cao)', page: '03' },
      { title: '3. Thông số tối ưu cho nhóm Lan Hài nhiệt đới (đồng bằng)', page: '07' },
      { title: '4. Biểu đồ biến thiên ánh sáng theo chu kỳ sinh trưởng', page: '10' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Khái quát thông số kỹ thuật',
      },
      {
        type: 'paragraph',
        text: 'Tài liệu này tổng hợp dữ liệu định lượng của 15 năm thực nghiệm. Mỗi loài thuộc chi Paphiopedilum có một yêu cầu sinh thái riêng biệt. Việc áp dụng sai lệch thông số về độ ẩm rễ có thể làm suy kiệt rễ chỉ trong vòng 48 tiếng.',
      },
    ],
  },
  {
    id: 'nhan-giong-invitro-lan-rung',
    title: 'Kỹ thuật Nhân giống In-vitro Lan Rừng',
    category: 'Nghiên cứu khoa học',
    categoryLabel: 'PDF',
    format: 'PDF',
    author: 'TS. Trần Anh Thư',
    year: 2022,
    size: '8.4 MB',
    pages: 36,
    views: 1420,
    downloads: 230,
    publisher: 'Học viện Lâm nghiệp Việt Nam',
    description: 'Quy trình khoa học hoàn chỉnh để nhân giống vô tính các loài lan rừng bản địa quý hiếm của Việt Nam nhằm phục vụ mục đích tái thả về tự nhiên.',
    summary: 'Quy trình khoa học hoàn chỉnh để nhân giống vô tính các loài lan rừng bản địa quý hiếm của Việt Nam nhằm phục vụ mục đích tái thả về tự nhiên và bảo tồn gen hoang dã bền vững.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-Lp2REc_6pvjhIMc0RmFbhLEALxh4LyQaOWGfd4uwik8rAXF40yTal2J1Y4F_DDDc2IDZCMPZBIIkDBWsc39obDBLudnypUNdy3DphHgmJLrv9I2VfDYq-k6EFGdFCfuuqnwoYOclluDPkBqn1J2HWXL7bQ3gODJniSPm0i_ngSxxKtlvRFb5dJWmbemMyi7qY_F1QHpp0iaYhmx_Cpc9OOqml_mI2Cfdt9FvHB4rKL-fDSW2r-ASfVhHU6jTPt9yTgtxKUyjG0u8',
    imageAlt: 'A minimalist book cover depicting an orchid silhouette on soft background.',
    sections: [
      { title: '1. Khảo sát hiện trạng nguồn gen lan rừng', page: '03' },
      { title: '2. Phương pháp khử trùng mẫu cấy đặc thù', page: '11' },
      { title: '3. Công thức dinh dưỡng kích thích ra rễ khỏe mạnh', page: '22' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Khái quát về hiện trạng loài',
      },
      {
        type: 'paragraph',
        text: 'Nghiên cứu tập trung vào các giống lan Thủy Tiên, Đai Châu và Hoàng Thảo hoang dã. Việc nhân giống nhân tạo giúp giảm áp lực khai thác rừng tự nhiên.',
      },
    ],
  },
  {
    id: 'bao-cao-bao-ton-2023',
    title: 'Báo cáo Thường niên Bảo tồn 2023',
    category: 'Tài liệu nội bộ',
    categoryLabel: 'Độc quyền',
    format: 'PDF',
    author: 'Hội đồng Khoa học Luxe',
    year: 2023,
    size: '15.2 MB',
    pages: 112,
    views: 950,
    downloads: 120,
    publisher: 'Orchidée Luxe Press',
    description: 'Báo cáo thống kê chi tiết về các dự án bảo tồn hoa lan quý hiếm trên toàn quốc, ghi nhận các tiến bộ về lưu trữ hạt giống.',
    summary: 'Báo cáo thống kê chi tiết về các dự án bảo tồn hoa lan quý hiếm trên toàn quốc, ghi nhận các tiến bộ về lưu trữ hạt giống và các công trình hợp tác bảo tồn quốc tế trong năm 2023.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuJM0CxcCUrpscErUyaPuvD2ZAkEEgoIXGAtcDHOhLAVd3Po-NSKjqfGyFLny_5ohDloZZ8vU5ysuFn13DK8_LGFsQqybCXC8_B2hzm_M2vnHwiHtNn6RPXInrXbQJyBltgEUcx3BfB67Pl7QnqRIB4DL8XBc7wSJRVLAPQ872RA4m63SeEvk6w6Dn-f1xmv3pyXF5oeUtOPmAQ13foF4KRI2c-FYZ5DqhzFItlt1czzfUFpY2QKvH8yDI4s7DaStZn43JErA1mgTA',
    imageAlt: 'A premium corporate-style publication featuring botanical leaf close-up.',
    sections: [
      { title: '1. Lời mở đầu từ ban lãnh đạo', page: '04' },
      { title: '2. Tiến độ thu thập hạt giống và lưu trữ cryo-bank', page: '18' },
      { title: '3. Bản đồ phân bố các khu vực bảo tồn trọng điểm', page: '45' },
    ],
    content: [
      {
        type: 'heading',
        text: '1. Định hướng chiến lược',
      },
      {
        type: 'paragraph',
        text: 'Trong năm qua, Orchidée Luxe đã đồng hành cùng các vườn quốc gia xây dựng hệ sinh thái bán hoang dã để di thực bảo tồn nhiều quần thể lan quý hiếm.',
      },
    ],
  },
  {
    id: 'danh-luc-thuc-vat-tay-bac',
    title: 'Danh lục Thực vật vùng Tây Bắc',
    category: 'Nghiên cứu khoa học',
    categoryLabel: 'PDF',
    format: 'PDF',
    author: 'Viện Hàn lâm Khoa học Lâm Nghiệp',
    year: 2021,
    size: '22.1 MB',
    pages: 240,
    views: 1980,
    downloads: 410,
    publisher: 'Nhà xuất bản Khoa Học Tự Nhiên',
    description: 'Tài liệu tra cứu hệ thực vật phong phú vùng Tây Bắc Việt Nam, có chương chuyên đề nghiên cứu sâu về các loài lan hài bản địa.',
    summary: 'Tài liệu tra cứu hệ thực vật phong phú vùng Tây Bắc Việt Nam, có chương chuyên đề nghiên cứu sâu về các loài lan hài bản địa và môi trường sinh thái đặc thù vùng núi cao.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEZM_bRksmVOYXCwuQj2JHBg-TD3QGwPlAq0_DNkKEIwHsLdSusTes-DAtvRsE54Gny250aGoeh-PxYD0TdaM3QRKp2Xgq326KNz-WYqFkW6bRpkMX2Kww5i--wdbk9YfR1_wfZ-Ouf35gM2bZ4zmcreUOc2BGjAueu7NpUUWKC6nJlf0INiMUsv04AID35SpM5aA3P18tZPp7xxrzPagaSnwo4ONpAdVyZukisA3LoxlBKhMsQ-2lY5rvyz_cgnC02Xdz8MiIaOFx',
    imageAlt: 'Vintage botanical herbarium sheet representation.',
    sections: [
      { title: 'Chương I: Tổng quan địa hình và thổ nhưỡng Tây Bắc', page: '12' },
      { title: 'Chương II: Phân loại họ Phong lan (Orchidaceae)', page: '54' },
      { title: 'Chương III: Các biện pháp khoanh vùng bảo vệ nghiêm ngặt', page: '185' },
    ],
    content: [
      {
        type: 'heading',
        text: 'Chương I: Địa hình Tây Bắc',
      },
      {
        type: 'paragraph',
        text: 'Hệ sinh thái Tây Bắc là cái nôi của nhiều loài Lan quý hiểm. Với độ cao trung bình trên 1500m, nơi đây cung cấp điều kiện mát mẻ quanh năm cực kỳ thuận lợi cho sự sinh trưởng của lan hài.',
      },
    ],
  },
];
