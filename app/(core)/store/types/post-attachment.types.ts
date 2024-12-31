import { Post } from '@/app/(core)/store/types/post.types';

export interface PostAttachment {
  id: string;
  postId: string;
  file: string;
  filename: string | null;
  resourceType: string;
  post?: Post;
}
