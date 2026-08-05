import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clientApi } from '@api/api';

export default function SigninPage() {
  const navigate = useNavigate();
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await clientApi.post('/auth/signup', { name, email, password: pass });
      navigate('/login', { replace: true });
      alert('회원가입이 완료되었습니다. 로그인해 주세요.');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '회원가입에 실패했습니다.');
    }
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center py-12"
    >
      {/* 다크 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 카드 */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">

          {/* 헤더 */}
          <div className="text-center pb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">회원가입</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">계정을 만들어 서비스를 이용하세요.</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit}>
            {/* 이름 */}
            <div className="mb-4">
              <label className={labelClass}>이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* 이메일 */}
            <div className="mb-4">
              <label className={labelClass}>이메일 주소</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label className={labelClass}>비밀번호</label>
              <input
                type="password"
                placeholder="6자 이상 입력하세요"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>

            {/* 가입하기 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
              >
                가입하기
              </button>
            </div>

            {/* 로그인 링크 */}
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
              <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                로그인
              </Link>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
}
