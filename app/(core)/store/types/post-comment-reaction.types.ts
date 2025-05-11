import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import {
  UserReactionType,
  UserReactionTypeEnum,
} from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostCommentReaction {
  commentId: string;
  userId: string;
  reaction: UserReactionTypeEnum;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  comment?: PostComment;
  userReactionType?: UserReactionType;
}
