export type JoinPayload = {
  userId: string;
  password: string;
  name: string;
  email?: string;
};

export type User = { uuid: number; name: string };

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type JoinResponse = LoginResponse;
