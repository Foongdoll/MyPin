import { Loader2 } from "lucide-react";
import useJoin from "../../features/auth/useJoin";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) => (
  <div className="text-left">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 ${
        error ? "border-red-400 focus:ring-red-400" : "focus:ring-blue-500"
      }`}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const Join = () => {
  const { form, errors, loading, onChange, handleSubmit } = useJoin();

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100">
      <div className="m-auto flex flex-col gap-6 w-[520px] p-10 bg-white border border-gray-200 rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">MYPIN 회원가입</h1>
          <p className="text-gray-500 text-sm mt-1">한 번의 가입으로 개발·일상 모두를 정리하세요</p>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <Input
            label="아이디"
            value={form.userId}
            onChange={(v) => onChange("userId", v)}
            error={errors.userId}
            placeholder="아이디를 입력하세요 (4자 이상)"
          />
          <Input
            label="비밀번호"
            type="password"
            value={form.password}
            onChange={(v) => onChange("password", v)}
            error={errors.password}
            placeholder="비밀번호를 입력하세요 (8자 이상)"
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={form.passwordConfirm}
            onChange={(v) => onChange("passwordConfirm", v)}
            error={errors.passwordConfirm}
            placeholder="비밀번호를 다시 입력하세요"
          />
          <Input
            label="이름"
            value={form.name}
            onChange={(v) => onChange("name", v)}
            error={errors.name}
            placeholder="홍길동"
          />
          <Input
            label="이메일(선택)"
            value={form.email ?? ""}
            onChange={(v) => onChange("email", v)}
            error={errors.email}
            placeholder="name@example.com"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-all duration-200 flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          회원가입
        </button>

        <p className="text-sm text-gray-500 text-center">
          이미 계정이 있으신가요?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
};

export default Join;
