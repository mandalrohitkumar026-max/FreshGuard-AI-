import api from './apiClient';
import { ApiResponse, AuthData } from '../types/api.types';

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const res = await api.post<ApiResponse<AuthData>>('/auth/register', {
      name,
      email,
      password,
    });
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<AuthData>>('/auth/login', { email, password });
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/logout');
    return res.data;
  },
};
