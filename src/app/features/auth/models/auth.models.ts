export interface AuthUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface LoginFormModel {
  email: string;
  password: string;
}

export interface RegisterFormModel {
  email: string;
  password: string;
  confirmPassword: string;
}
