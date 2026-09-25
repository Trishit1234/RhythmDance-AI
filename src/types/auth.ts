export type UserRole =
  | "student"
  | "tutor"
  | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;

  createdAt?: unknown;
}

export interface AuthUser extends UserProfile {}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}