import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@store/authSlice';
import { toggleTheme } from '@store/themeSlice';

const SunIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
		<path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
	</svg>
);

const MoonIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
		<path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/>
	</svg>
);

export const HeaderMenu = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const { mode } = useAppSelector((state) => state.theme);
	const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

	const handleLogout = async () => {
		await dispatch(logout());
		navigate('/login', { replace: true });
	};

	return (
		<nav
			style={{
				position: 'fixed',
				top: 0, left: 0, right: 0,
				zIndex: 1030,
				height: 56,
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #dee2e6',
				boxShadow: '0 1px 4px rgba(0,0,0,.08)',
				display: 'flex',
				alignItems: 'center',
				padding: '0 24px',
			}}
		>
			{/* ── 로고 ── */}
			<Link
				to="/home"
				style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
			>
				<div style={{
					width: 32, height: 32, borderRadius: 6,
					backgroundColor: '#0d6efd', color: '#fff',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					fontWeight: 700, fontSize: '0.85rem',
				}}>H</div>
				<span style={{ fontWeight: 700, color: '#212529' }}>Horilla</span>
			</Link>

			{/* ── 우측 영역 (항상 표시) ── */}
			<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

				{/* 다크/라이트 모드 토글 */}
				<button
					onClick={() => dispatch(toggleTheme())}
					title={mode === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
					style={{
						width: 34, height: 34,
						borderRadius: '50%',
						border: '1px solid #6c757d',
						backgroundColor: 'transparent',
						cursor: 'pointer',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						color: '#495057',
						flexShrink: 0,
					}}
				>
					{mode === 'dark' ? <SunIcon /> : <MoonIcon />}
				</button>

				{/* 로그인 사용자 이름 */}
				{user && (
					<span style={{ color: '#6c757d', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
						{user.name}
					</span>
				)}

				{/* 로그인 / 로그아웃 - 관리자만 표시 */}
				{isAdmin && (
					user ? (
						<button
							onClick={handleLogout}
							style={{
								padding: '4px 12px', fontSize: '0.875rem',
								backgroundColor: '#0d6efd', color: '#fff',
								border: 'none', borderRadius: 4, cursor: 'pointer',
								whiteSpace: 'nowrap',
							}}
						>
							로그아웃
						</button>
					) : (
						<Link
							to="/login"
							style={{
								padding: '4px 12px', fontSize: '0.875rem',
								backgroundColor: '#0d6efd', color: '#fff',
								border: 'none', borderRadius: 4,
								whiteSpace: 'nowrap', textDecoration: 'none',
							}}
						>
							로그인
						</Link>
					)
				)}
			</div>
		</nav>
	);
};

export default HeaderMenu;
