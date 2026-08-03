export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  emailVerified: boolean;
  oauthProvider?: string;
  oauthId?: string;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}
