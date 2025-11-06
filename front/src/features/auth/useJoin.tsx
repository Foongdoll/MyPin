import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { join } from "./AuthService"
import { useSessionStore } from "../../state/session.store";
import type { JoinPayload } from "../../shared/types/AuthType";

type Errors = Partial<Record<keyof JoinPayload | "passwordConfirm", string>>;

const MIN_ID = 4;
const MIN_PW = 8;

export default function useJoin() {
  const [form, setForm] = useState<JoinPayload & { passwordConfirm: string }>({
    userId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useSessionStore();

  const onChange = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined })); // 해당 필드 에러 즉시 정리
  };

  const validate = () => {
    const e: Errors = {};
    if (!form.userId.trim()) e.userId = "아이디를 입력해주세요.";
    else if (form.userId.length < MIN_ID) e.userId = `아이디는 최소 ${MIN_ID}자 이상`;

    if (!form.password.trim()) e.password = "비밀번호를 입력해주세요.";
    else if (form.password.length < MIN_PW) e.password = `비밀번호는 최소 ${MIN_PW}자 이상`;

    if (!form.passwordConfirm.trim()) e.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    else if (form.password !== form.passwordConfirm) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";

    if (!form.name.trim()) e.name = "이름을 입력해주세요.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "이메일 형식이 올바르지 않습니다.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { passwordConfirm, ...payload } = form;
      const res = await join(payload);

      // 서버가 토큰 반환하면 자동 로그인, 아니면 로그인 페이지로 이동
      if (res?.accessToken && res?.user) {
        setSession(res.accessToken, res.refreshToken ?? null, res.user ?? null);
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setErrors((e) => ({ ...e, userId: "이미 존재하는 아이디거나 서버 오류입니다." }));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    onChange,
    handleSubmit,
  };
}
