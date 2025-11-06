import { Link } from "react-router-dom";
import useLogin from "../../features/auth/useLogin";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { id, pw, setId, setPw, handleLogin, loading, error } = useLogin();

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="m-auto flex flex-col gap-6 w-[450px] p-10 bg-white border border-gray-200 rounded-2xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">MYPIN 로그인</h1>
        <p className="text-gray-500 text-sm">일상과 개발을 연결하는 당신의 공간</p>

        <div className="flex flex-col gap-4 mt-6">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-all duration-200 flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          로그인
        </button>

        <p className="text-sm text-gray-500 mt-4">
          계정이 없으신가요?{" "}
          <Link to="/join" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
