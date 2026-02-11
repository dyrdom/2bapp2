import axios from 'axios';

import { api } from './client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export const login = async ({ email, password }: LoginPayload): Promise<LoginResponse> => {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const messageFromApi =
        (typeof error.response?.data === 'object' &&
          error.response?.data !== null &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string' &&
          error.response.data.message) ||
        'Login failed. Please check your credentials and try again.';

      throw new Error(messageFromApi);
    }

    throw new Error('Unexpected error during login.');
  }
};
