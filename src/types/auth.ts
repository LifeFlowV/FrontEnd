export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}
