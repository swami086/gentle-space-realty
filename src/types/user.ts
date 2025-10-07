export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  googleId?: string;
  savedProperties: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}