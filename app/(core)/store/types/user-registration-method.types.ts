import { User } from "@/app/(core)/store/types/user.types";


export enum UserRegistrationMethodEnum {
  Default = 'Default',
  Google = 'Google',
  Discord = 'Discord',
  Apple = 'Apple',
}

export interface UserRegistrationMethod {
  name: UserRegistrationMethodEnum;
  users?: User[];
}
