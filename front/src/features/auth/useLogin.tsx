import { useState } from "react";
import { useSessionStore } from "../../state/session.store"; // 이미 있는 세션 스토어와 연동 예시
import { useNavigate } from "react-router-dom";
import { login } from "./AuthService";

const useLogin = () => {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setSession } = useSessionStore(); // 실제 세션 처리 훅 예시

    const handleLogin = async () => {
        if (!id.trim() || !pw.trim()) {
            setError("아이디와 비밀번호를 입력해주세요.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            
            // const r = await login(id, pw);
            // if(r) setSession(r?.accessToken, r?.refreshToken, r?.user)
            navigate("/home");
        } catch (e: any) {
            setError("로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
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
