/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Orchid {
  id?: string;
  name: string;
  englishName: string;
  categoryIds: string[];
  shortDescription: string;
  detailedDescription: string;
  hasFragrance: boolean;
  isPopular: boolean;
  slug: string;
  uploadedImageIds: string[];
  displayOrder: number;
  highlightDescription?: string;
  lightDetail?: string;
  tempDetail?: string;
  watering?: string;
  fertilizer?: string;
  soilType?: string;
}

export interface Question {
  id: string;
  sender: string;
  avatarLetter: string;
  avatarColor: string; // e.g., "bg-secondary-fixed text-on-secondary-fixed" or other class names
  content: string;
  timeAgo: string;
  replied: boolean;
  replyContent?: string;
  repliedBy?: string;
  repliedAt?: string;
}

export interface DocumentItem {
  id?: string;
  title: string;
  description: string;
  originalName: string;
  extension: string;
  sizeBytes: number;
  url: string;
  createdAt?: string;
}

export interface PaginatedDocuments {
  items: DocumentItem[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Article {
  id?: string;
  title: string;
  category: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  status: 'Published' | 'Draft';
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  scientificName?: string;
  description: string;
  orchidCount: number;
}

export interface Comment {
  id: string;
  author: string;
  avatarLetter: string;
  avatarColor: string;
  content: string;
  timeAgo: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorRole: string;
  avatarLetter: string;
  avatarColor: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  timeAgo: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CareArticle {
  id?: string | number;
  title: string;
  content: string;
  imageUrl?: string;
  // Các trường khác có thể được bổ sung dựa theo schema thực tế của backend
}
export interface OrchidItem {
  id: string;
  name: string;
  scientificName: string;
  vietnameseName: string;
  image: string;
  description: string;
  longDescription: string;
  origin: string;
  watering: string;
  light: string;
  temperature: string;
  fertilizer: string;
  soilType: string;
  conservationStatus: string;
}

export interface ResearchArticle {
  id: string;
  title: string;
  author: string;
  publishedDate: string;
  summary: string;
  content: string;
  category: string;
}

export interface PillarDetail {
  id: string;
  title: string;
  description: string;
  items: {
    name: string;
    description: string;
    details?: string;
  }[];
}

export interface DiscussionComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  isUserComment?: boolean;
}

export interface DiscussionPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  content: string;
  imageSrc?: string;
  likes: number;
  likedByCurrentUser?: boolean;
  comments: DiscussionComment[];
  tags: string[];
}


export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface OrchidCareArticle {
  id: string;
  category: "Kỹ thuật" | "Dinh dưỡng" | "Phòng bệnh" | "Mẹo vặt";
  title: string;
  author: string;
  date: string;
  description: string;
  content: string;
  imageUrl: string;
  featured: boolean;
    comments?: { id: string; user: string; avatar: string; text: string; date: string; }[];
}

export interface OrchidDocument {
  id: string;
  title: string;
  category: string; // 'Nghiên cứu' | 'Hướng dẫn' | 'Kỹ thuật'
  categoryLabel: string;
  format: 'PDF' | 'DOCX' | 'XLSX';
  author: string;
  year: number;
  size: string;
  description: string;
  publisher: string;
  pages: number;
  views: number;
  downloads: number;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  sections: { title: string; page: string }[];
  content: {
    type: 'heading' | 'subheading' | 'paragraph' | 'list' | 'image';
    text?: string;
    items?: string[];
    url?: string;
    caption?: string;
  }[];
}
