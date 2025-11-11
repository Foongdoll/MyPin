import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "../../../state/session.store";

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

// ⬇ 필요하면 쿠키 기반 리프레시를 위해 withCredentials 맞춰주세요.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // 서버가 httpOnly 쿠키로 refresh를 관리한다면 주석 해제 + CORS allow-credentials 필요
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const { refreshToken } = useSessionStore.getState();
    if (!refreshToken) throw new Error("No refresh token");

    refreshPromise = (async () => {
      const { data } = await refreshClient.post<{ accessToken: string }>("/auth/refresh", { refreshToken });
      const newToken = data.accessToken;
      useSessionStore.getState().setAccessToken(newToken);
      return newToken;
    })().finally(() => { refreshPromise = null; });
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

      // 🔹 네트워크/타임아웃/CORS 차단 등: error.response 없음
      if (!error.response) {              

        console.error("[NO RESPONSE]", {
          code: (error as any).code,
          message: error.message,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });
        return Promise.reject(error);
      }

      const status = error.response.status;

      // 🔹 refresh 엔드포인트 자체에서 401/403이 나면 더 이상 재시도/루프 금지
      if (originalRequest.url?.includes("/auth/refresh")) {
        console.warn("Refresh call failed → hard logout");
        await useSessionStore.getState().logout({ reason: "expired" });
        location.href = "/login";
        return Promise.reject(error);
      }

      // 🔹 401 처리 (엑세스 토큰 만료 가정)
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // 원 요청 재시도
          return instance(originalRequest);
        } catch (e) {
          console.warn("토큰 갱신 실패 → 세션 로그아웃");
          await useSessionStore.getState().logout({ reason: "expired" });
          location.href = "/login";
          return Promise.reject(e);
        }
      }

      // 🔹 403/419 처리
      if (status === 403 || status === 419) {
        await useSessionStore.getState().logout({ reason: "expired" });
        location.href = "/login";
        return Promise.reject(error);
      }

      console.error("[Response Error]", { status, data: error.response.data });
      return Promise.reject(error);
    }
  );
}
