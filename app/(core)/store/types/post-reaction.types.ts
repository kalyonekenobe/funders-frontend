import { Post } from '@/app/(core)/store/types/post.types';
import {
  UserReactionType,
  UserReactionTypeEnum,
} from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostReaction {
  userId: string;
  postId: string;
  reactionType: UserReactionTypeEnum;
  datetime: Date;
  user?: User;
  post?: Post;
  userReactionType?: UserReactionType;
}
