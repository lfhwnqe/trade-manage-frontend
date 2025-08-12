export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  user: User;
}
