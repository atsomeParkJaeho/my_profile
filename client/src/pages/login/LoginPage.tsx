import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, clearError } from '@store/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password: pass }));
    if (login.fulfilled.match(result)) {
      navigate('/home', { replace: true });
    }
  };

  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center py-12"
    >
      {/* 다크 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 카드 */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white overflow-hidden p-4 dark:bg-gray-800 rounded-2xl shadow-2xl p-8">

          {/* 헤더 */}
          <div className="text-center pb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">로그인</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">계정에 로그인하여 계속하세요.</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일 주소
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                style={{display: 'block', width: '100%', padding: '10px 12px'}}
              />
            </div>

            {/* 비밀번호 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="***********"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                style={{display: 'block', width: '100%', padding: '10px 12px'}}
              />
            </div>

            {/* 로그인 버튼 */}
            <div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
                style={{display: 'block', width: '100%', padding: '12px'}}
              >
                로그인
              </button>
            </div>

            {/* 회원가입 링크 */}
            {/*<div className="mt-4 text-center">*/}
            {/*  <span className="text-sm text-gray-500">계정이 없으신가요? </span>*/}
            {/*  <Link to="/signin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">*/}
            {/*    회원가입*/}
            {/*  </Link>*/}
            {/*</div>*/}
          </form>

        </div>
      </div>
    </section>
  );
}
