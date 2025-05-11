import { Post } from '@/app/(core)/store/types/post.types';

export interface PostAttachment {
  id: string;
  postId: string;
  location: string;
  filename: string | null;
  createdAt: Date;
  updatedAt: Date;
  post?: Post;
}
