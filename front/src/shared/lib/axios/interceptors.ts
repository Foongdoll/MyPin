import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "../../../state/session.store";

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// refresh 전용 클라이언트 (인터셉터 미적용)
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const { refreshToken } = useSessionStore.getState();
    if (!refreshToken) throw new Error("No refresh token");

    refreshPromise = (async () => {
      const { data } = await refreshClient.post<{ accessToken: string }>("/auth/refresh", {
        refreshToken,
      });
      const newToken = data.accessToken;
      useSessionStore.getState().setAccessToken(newToken);
      return newToken;
    })().finally(() => {
      // 다음 갱신을 위해 해제
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function setupInterceptors(instance: AxiosInstance) {
  // 요청 인터셉터
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

  // 응답 인터셉터
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = (error.config || {}) as RetryRequestConfig;

      // 401 처리: 최초 1회만 재시도
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (e) {
          console.warn("토큰 갱신 실패 — 세션 로그아웃");
          useSessionStore.getState().logout();
        }
      }

      // 권한 없음/세션 만료 케이스 (선택): 바로 로그아웃 처리
      if (error.response?.status === 403 || error.response?.status === 419) {
        useSessionStore.getState().logout();
      }

      console.error("[Response Error]", error);
      return Promise.reject(error);
    }
  );
}
