import axios from "axios";
import type { AxiosInstance } from "axios";

export const HTTP_CLIENT: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:3000/api/v1"
      : "/api/v1",
  withCredentials: true,
});
