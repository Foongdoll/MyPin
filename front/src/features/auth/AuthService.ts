import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type { JoinPayload, JoinResponse, LoginResponse } from "../../shared/types/AuthType";


export async function join(payload: JoinPayload) {
  // 서버가 반환하는 스펙에 맞춰 필드명 조정
  const { data } = await api.post<JoinResponse>("/auth/join", payload);
  return data;
}

export const login = async (userId: string, userPw: string) => {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
        userId,
        userPw,
    });
    return res.data.data;
};
