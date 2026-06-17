export type JwtPayload = {
  sub: string; // userId
  username: string;
  email?: string;
  name?: string;
  iat?: number; // issued at
  exp?: number; // expiration time
};
