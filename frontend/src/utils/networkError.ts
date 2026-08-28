import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }

    if (error.response?.status === 404) {
      return 'The requested data could not be found.';
    }

    if (error.response && error.response.status >= 500) {
      return 'The server is temporarily unavailable. Please try again later.';
    }

    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
