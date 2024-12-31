import { CategoriesOnPosts } from '@/app/(core)/store/types/categories-on-posts.types';
import { PostAttachment } from '@/app/(core)/store/types/post-attachment.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { PostDonation } from '@/app/(core)/store/types/post-donation.types';
import { PostReaction } from '@/app/(core)/store/types/post-reaction.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  fundsToBeRaised: number;
  image: string | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  removedAt: Date | null;
  author?: User;
  categories?: CategoriesOnPosts[];
  attachments?: PostAttachment[];
  donations?: PostDonation[];
  reactions?: PostReaction[];
  comments?: PostComment[];
}
