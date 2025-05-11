import { Post } from '@/app/(core)/store/types/post.types';
import {
  UserReactionType,
  UserReactionTypeEnum,
} from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostReaction {
  userId: string;
  postId: string;
  reaction: UserReactionTypeEnum;
  createdAt: Date;
  updatedAt: Date;
  datetime: Date;
  user?: User;
  post?: Post;
  userReactionType?: UserReactionType;
}
