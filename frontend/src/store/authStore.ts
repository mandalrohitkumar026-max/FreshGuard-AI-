import { create } from 'zustand';

interface AuthState {
  userId: string;
  name: string;
  email: string;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    userId: string;
    name: string;
    email: string;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: '000000000000000000000001',
  name: 'Guest User',
  email: 'guest@freshguard.ai',
  accessToken: null,
  refreshToken: null,
  isAuthenticated: true,

  setAuth: (data) =>
    set({
      userId: data.userId,
      name: data.name,
      email: data.email,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      userId: '000000000000000000000001',
      name: 'Guest User',
      email: 'guest@freshguard.ai',
      accessToken: null,
      refreshToken: null,
      isAuthenticated: true,
    }),
}));
