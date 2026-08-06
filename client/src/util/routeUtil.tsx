import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import LoginPage from '@pages/login/LoginPage';
import HomePage  from '@pages/home/HomePage';
import CommunityPage from "@pages/community/Page";
// import SigninPage from '@pages/signin/SigninPage';

// ── 인증 필요 라우트 (미로그인 시 /login 이동) ─────────────────────────────
const PrivateRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAppSelector((state) => state.auth);
  return user ? element : <Navigate to="/login" replace />;
};

// ── 비인증 전용 라우트 (로그인 상태면 /home 이동) ──────────────────────────
const PublicRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAppSelector((state) => state.auth);
  return user ? <Navigate to="/home" replace /> : element;
};

// ── 라우트 목록 ────────────────────────────────────────────────────────────
export const RouteList: { path: string; element: JSX.Element }[] = [
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/login',
    element: <PublicRoute element={<LoginPage />} />,
  },
  // 회원가입 비활성화
  // {
  //   path: '/signin',
  //   element: <PublicRoute element={<SigninPage />} />,
  // },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/community/list',
    element: <CommunityPage />,
  },
  {
    path: '/community/write',
    element: <CommunityPage />,
  },
  {
    path: '/community/detail',
    element: <CommunityPage />,
  }
];

export const LeftMenuList = [
  {
    name:`게시판`,
    to:`/community/list`,
    icon:`bi-journal-text`,
    activePrefix: `/community`,
  },
  {
    name:`프로필`,
    to:`/home`,
    icon:`bi-person`,
    activePrefix: `/home`,
  },
];

