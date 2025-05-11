import { PostComment } from '@/app/(core)/store/types/post-comment.types';

export interface PostCommentAttachment {
  id: string;
  commentId: string;
  location: string;
  filename: string | null;
  createdAt: Date;
  updatedAt: Date;
  comment?: PostComment;
}
