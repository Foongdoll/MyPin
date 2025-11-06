export type JoinPayload = {
  userId: string;
  password: string;
  name: string;
  email?: string;
};

export type JoinResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: { uuid: number; name: string };
};

export type LoginResponse = { accessToken: string, refreshToken: string, user : User };
export type User = { uuid: number; name: string } | null;