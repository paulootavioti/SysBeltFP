import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3333" : "/api");

export const api = axios.create({
  baseURL,
});
