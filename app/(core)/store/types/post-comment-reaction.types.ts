import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import {
  UserReactionType,
  UserReactionTypeEnum,
} from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostCommentReaction {
  commentId: string;
  userId: string;
  reactionType: UserReactionTypeEnum;
  datetime: Date;
  user?: User;
  comment?: PostComment;
  userReactionType?: UserReactionType;
}
