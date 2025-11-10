import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "../../../state/session.store";

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const { refreshToken } = useSessionStore.getState();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    refreshPromise = (async () => {
      const { data } = await refreshClient.post<{ accessToken: string }>("/auth/refresh", {
        refreshToken,
      });
      const newToken = data.accessToken;
      useSessionStore.getState().setAccessToken(newToken);
      return newToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useSessionStore.getState().accessToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      console.error("[Request Error]", error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = (error.config || {}) as RetryRequestConfig;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch {
          console.warn("토큰 갱신 실패 → 세션 로그아웃");
          await useSessionStore.getState().logout({ reason: "expired" });
        }
      }

      if (error.response?.status === 403 || error.response?.status === 419) {
        await useSessionStore.getState().logout({ reason: "expired" });
      }

      console.error("[Response Error]", error);
      return Promise.reject(error);
    }
  );
}
