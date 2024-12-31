import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { Post } from '@/app/(core)/store/types/post.types';

export enum UserReactionTypeEnum {
  Like = 'Like',
  Dislike = 'Dislike',
  Laugh = 'Laugh',
  Crying = 'Crying',
  Heart = 'Heart',
  Anger = 'Anger',
}

export interface UserReactionType {
  name: string;
  posts?: Post[];
  comments?: PostComment[];
}
