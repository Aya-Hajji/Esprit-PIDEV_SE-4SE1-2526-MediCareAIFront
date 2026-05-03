import { Post, Reply } from '../../../shared/models/forum.model';

export interface PostExtended extends Post {
  viewCount?: number;
  viewsCount?: number;  // backend alias
  likerCount?: number;
  likesCount?: number;  // backend alias
  isLiked?: boolean;
  category?: string;
  isPinned?: boolean;
  lastReplyDate?: string;
  authorAvatar?: string;
}

export interface ReplyExtended extends Reply {
  likeCount?: number;
  isLiked?: boolean;
  authorAvatar?: string;
  authorRole?: string;
  isEdited?: boolean;
  editedAt?: string;
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  color: string;
}

export interface ForumFilter {
  category?: string;
  premiumOnly?: boolean;
  searchTerm?: string;
  sortBy?: 'newest' | 'popular' | 'mostReplies';
}
