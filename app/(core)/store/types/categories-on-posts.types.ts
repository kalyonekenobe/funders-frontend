import { PostCategory } from '@/app/(core)/store/types/post-category.types';
import { Post } from '@/app/(core)/store/types/post.types';

export interface CategoriesToPosts {
  postId: string;
  category: string;
  post?: Post;
  postCategory?: PostCategory[];
}
