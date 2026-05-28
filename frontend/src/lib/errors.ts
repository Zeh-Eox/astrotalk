import axios from "axios";

export const getErrorMessage = (
  error: unknown,
  fallback = "Unexpected error"
): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
