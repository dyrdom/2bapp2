import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
  // Keeping this as a runtime guard helps fail fast in development.
  // eslint-disable-next-line no-console
  console.error('VITE_API_URL is not set. Check apps/web/.env');
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});
