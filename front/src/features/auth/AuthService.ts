import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type { JoinPayload, LoginResponse } from "../../shared/types/AuthType";

export async function join(payload: JoinPayload) {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/join", payload);
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "회원가입에 실패했습니다.");
  }
  return data.data;
}

export const login = async (userId: string, userPw: string) => {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
    userId,
    userPw,
  });
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? "로그인에 실패했습니다.");
  }
  return res.data.data;
};
