import { api } from "../../services/api";

export class ApiClient {
  static async get<T>(url: string) {
    const response = await api.get<T>(url);
    return response.data;
  }

  static async post<T>(url: string, data: unknown) {
    const response = await api.post<T>(url, data);
    return response.data;
  }

  static async put<T>(url: string, data: unknown) {
    const response = await api.put<T>(url, data);
    return response.data;
  }

  static async patch<T>(url: string, data?: unknown) {
    const response = await api.patch<T>(url, data);
    return response.data;
  }

  static async delete<T>(url: string) {
    const response = await api.delete<T>(url);
    return response.data;
  }
}