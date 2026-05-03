export interface Post {
  id?: number;
  title: string;
  content: string;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
  tags?: string[];
  replyCount?: number;
  premiumOnly?: boolean;
}

export interface Reply {
  id?: number;
  content: string;
  postId: number;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
}
