import { useEffect, useState } from 'react';
import { getCommunity, deleteCommunity } from '@api/community';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// HTML 태그 제거 후 지정 길이만큼 잘라 반환
const stripHtml = (html: string, max = 80) => {
	const text = html?.replace(/<[^>]*>/g, '') ?? '';
	return text.length > max ? text.slice(0, max) + '…' : text;
};

const GalleryListLayout = ({ id, layout = 'gallery', type = 'default' }: { id?: any; layout?: string; type?: string }) => {
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin  = user?.email === ADMIN_EMAIL;

	const [list,    setList]    = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getCommunity(layout, type).then((res) => {
			if (res) setList(res);
			setLoading(false);
		});
	}, [layout, type]);

	const onHandleDelete = async (e: React.MouseEvent, itemId: number) => {
		e.stopPropagation();
		if (!window.confirm('삭제하시겠습니까?')) return;
		try {
			await deleteCommunity(itemId);
			setList((prev) => prev.filter((item) => item.id !== itemId));
		} catch (err) {
			console.error(err);
		}
	};

	if (loading) return <div className="text-center py-5">로딩 중...</div>;

	return (
		<div>
			{isAdmin && (
				<div className="d-flex justify-content-end mb-3">
					<button
						className="btn btn-primary"
						onClick={() => navigate(`/${layout}/${type}/write`, { state: { actType: 'create' } })}
					>
						글쓰기
					</button>
				</div>
			)}

			<div className="row">
				{list.length === 0 ? (
					<div className="col-12 text-center py-5 text-muted">등록된 게시글이 없습니다.</div>
				) : (
					list.map((item) => (
						<div key={item.id} className="col-md-6 col-lg-4 mb-5">
							<div
								className="card shadow-sm h-100"
								style={{ cursor: 'pointer', transition: 'transform 0.2s', overflow: 'hidden' }}
								onClick={() => navigate(`/${layout}/${type}/detail`, { state: { id: item.id } })}
								onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
								onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
							>
								{/* 썸네일 이미지 (extra1) */}
								{item.extra1 ? (
									<img
										src={item.extra1}
										alt={item.title}
										className="card-img-top"
										style={{ height: 200, objectFit: 'cover' }}
									/>
								) : (
									<div
										className="d-flex align-items-center justify-content-center bg-secondary text-white"
										style={{ height: 200 }}
									>
										<i className="bi bi-image" style={{ fontSize: '2.5rem', opacity: 0.5 }} />
									</div>
								)}

								<div className="card-body p-3">
									<label className="small text-muted mb-2">
										{item.c_user_name} — {item.c_date}
									</label>
									<h5 className="mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
										{item.title}
									</h5>
									<p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
										{stripHtml(item.content)}
									</p>

									<div className="d-flex align-items-center border-top pt-2 small text-muted">
										<span className="me-auto">
											<i className="bi bi-calendar me-1" />{item.c_date}
										</span>
										{isAdmin && (
											<button
												className="btn btn-sm btn-outline-danger py-0 px-2"
												style={{ fontSize: '0.75rem' }}
												onClick={(e) => onHandleDelete(e, item.id)}
											>
												삭제
											</button>
										)}
										<span className="ms-2 text-primary fw-semibold">
											더보기 <i className="bi bi-chevron-right" />
										</span>
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default GalleryListLayout;
