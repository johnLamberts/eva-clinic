import axios, { AxiosError } from "axios";

export interface ApiErrorReponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// Helper functions
export const handleApiError = (error: unknown): string => {
  if(axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  
  if(error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occured'
}

export const isApiError = (error: unknown): error is AxiosError<ApiErrorReponse> => {
  return axios.isAxiosError(error);
}
