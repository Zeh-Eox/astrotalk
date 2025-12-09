import axios from "axios";

export const HTTP_CLIENT = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api/v1/" : "/api",
  withCredentials: true,
});