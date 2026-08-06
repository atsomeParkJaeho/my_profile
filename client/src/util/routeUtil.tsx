import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import LoginPage   from '@pages/login/LoginPage';
import HomePage    from '@pages/home/HomePage';
import BoardPage   from '@pages/community/Page';

// ── 인증 필요 라우트 ───────────────────────────────────────────────────────
const PrivateRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAppSelector((state) => state.auth);
  return user ? element : <Navigate to="/login" replace />;
};

// ── 비인증 전용 라우트 ─────────────────────────────────────────────────────
const PublicRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAppSelector((state) => state.auth);
  return user ? <Navigate to="/home" replace /> : element;
};

// ── 라우트 목록 ────────────────────────────────────────────────────────────
export const RouteList: { path: string; element: JSX.Element }[] = [
  { path: '/',      element: <Navigate to="/home" replace /> },
  { path: '*',      element: <Navigate to="/home" replace /> },
  { path: '/login', element: <PublicRoute element={<LoginPage />} /> },
  { path: '/home',  element: <HomePage /> },

  // 1차 카테고리 / 2차 카테고리 / 액션
  { path: '/community/:type/list',   element: <BoardPage /> },
  { path: '/community/:type/write',  element: <BoardPage /> },
  { path: '/community/:type/detail', element: <BoardPage /> },
  
  { path: '/banner/:type/list',      element: <BoardPage /> },
  { path: '/banner/:type/write',     element: <BoardPage /> },
  { path: '/banner/:type/detail',    element: <BoardPage /> },
  
  { path: '/gallery/:type/list',     element: <BoardPage /> },
  { path: '/gallery/:type/write',    element: <BoardPage /> },
  { path: '/gallery/:type/detail',   element: <BoardPage /> },

  // 하위 호환 리다이렉트
  { path: '/community/list',   element: <Navigate to="/community/default/list"   replace /> },
  { path: '/community/write',  element: <Navigate to="/community/default/write"  replace /> },
  { path: '/community/detail', element: <Navigate to="/community/default/detail" replace /> },
];

export const LeftMenuList = [
  {
    name: '프로필',
    to: '/home',
    icon: 'bi-person',
    activePrefix: '/home',
  },
  {
    name: '포트폴리오',
    to: '/community/portfolio/list',
    icon: 'bi-images',
    activePrefix: '/community/portfolio',
  },
  {
    name: '게시판',
    to: '/community/default/list',
    icon: 'bi-journal-text',
    activePrefix: '/community/default',
  },
];
