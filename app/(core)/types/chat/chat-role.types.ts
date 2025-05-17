import { UserToChat } from '@/app/(core)/store/types/user.types';

export interface ChatRole {
  name: string;
  permissions: number;
  createdAt: Date;
  updatedAt: Date;
  usersToChats?: UserToChat[];
}
