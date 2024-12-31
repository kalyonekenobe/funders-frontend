import { User } from '@/app/(core)/store/types/user.types';

export interface Following {
  followerId: string;
  userId: string;
  follower?: User;
  user?: User;
}
