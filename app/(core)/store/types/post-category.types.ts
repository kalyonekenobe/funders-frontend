import { Post } from '@/app/(core)/store/types/post.types';

export interface PostCategory {
  name: string;
  posts?: Post[];
}
