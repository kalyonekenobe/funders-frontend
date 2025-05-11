import { User } from '@/app/(core)/store/types/user.types';

export enum UserRegistrationMethodEnum {
  Credentials = 'Credentials',
  Google = 'Google',
  Discord = 'Discord',
  Apple = 'Apple',
  SolanaWallet = 'SolanaWallet',
}

export interface UserRegistrationMethod {
  name: UserRegistrationMethodEnum;
  users?: User[];
}
