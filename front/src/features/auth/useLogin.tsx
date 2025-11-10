import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./AuthService";
import { useSessionStore } from "../../state/session.store";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type { LoginResponse } from "../../shared/types/AuthType";
import axios from "axios";

const useLogin = () => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setSession } = useSessionStore();

  const handleLogin = async () => {
    if (!id.trim() || !pw.trim()) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await login(id.trim(), pw.trim());
      setSession(response.accessToken, response.refreshToken ?? null, response.user ?? null);
      navigate("/home", { replace: true });
    } catch (err) {
      let message = "로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해 주세요.";
      if (axios.isAxiosError<ApiResponse<LoginResponse>>(err)) {
        message = err.response?.data?.message ?? message;
      } else if (err instanceof Error) {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    id,
    pw,
    setId,
    setPw,
    handleLogin,
    loading,
    error,
  };
};

export default useLogin;
