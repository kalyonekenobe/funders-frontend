import { PostCommentAttachment } from '@/app/(core)/store/types/post-comment-attachment.types';
import { PostCommentReaction } from '@/app/(core)/store/types/post-comment-reaction.types';
import { Post } from '@/app/(core)/store/types/post.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  removedAt: Date | null;
  post?: Post;
  author?: User;
  parentComment?: PostComment;
  replies?: PostComment[];
  reactions?: PostCommentReaction[];
  attachments?: PostCommentAttachment[];
}
