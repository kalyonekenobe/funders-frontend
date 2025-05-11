import { Post } from '@/app/(core)/store/types/post.types';

export interface PostDonation {
  id: string;
  postId: string;
  details: any;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  post?: Post;
}
