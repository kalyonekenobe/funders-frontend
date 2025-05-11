import { User } from '@/app/(core)/store/types/user.types';

export enum UserRoleEnum {
  User = 'User',
  Volunteer = 'Volunteer',
  Administrator = 'Administrator',
}

export interface UserRole {
  name: UserRoleEnum;
  permissions: number;
  users?: User[];
}
