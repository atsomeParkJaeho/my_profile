import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-quill-new/dist/quill.snow.css';
import { getCommunityDetail } from '@api/community';
import { useAppSelector } from '@store/hooks';

const DetailPageLayout = ({ id, layout = 'community', type = 'default' }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin  = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

	const itemId = (location.state as any)?.id;
	const [item, setItem] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!itemId) { navigate(`/${layout}/${type}/list`); return; }
		getCommunityDetail(itemId)
			.then((data) => setItem(data))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [itemId]);

	if (loading) return <div className="text-center py-5">로딩 중...</div>;
	if (!item)   return <div className="text-center py-5 text-muted">게시글을 찾을 수 없습니다.</div>;

	return (
		<article className="card card-body mt-4">

			{/* 제목 */}
			<h4 className="mb-1">{item.title}</h4>

			{/* 메타 정보 */}
			<div className="d-flex align-items-center gap-3 text-muted mb-4" style={{fontSize: '0.85rem'}}>
				<span><i className="bi bi-person me-1"></i>{item.c_user_name}</span>
				<span><i className="bi bi-calendar3 me-1"></i>작성 {item.c_date} {item.c_time}</span>
				{item.e_date && (
					<span><i className="bi bi-pencil me-1"></i>수정 {item.e_date} {item.e_time}</span>
				)}
			</div>

			<hr />

			{/* 본문 */}
			<div
				className="py-3 ql-editor"
				style={{minHeight: '200px', lineHeight: '1.8', padding: '12px 0'}}
				dangerouslySetInnerHTML={{ __html: item.content ?? '' }}
			/>

			{/* 하단 작성자 정보 + 버튼 */}
			<div className="border-top pt-4 mt-3">
				<div className="row align-items-center">
					<div className="col-md-6">
						<div className="d-flex align-items-center">
							<div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
								style={{width: 40, height: 40, fontSize: '1rem', flexShrink: 0}}>
								{item.c_user_name?.charAt(0) ?? '?'}
							</div>
							<div className="ps-3">
								<h6 className="mb-0">{item.c_user_name}</h6>
								<span className="text-muted" style={{fontSize: '0.8rem'}}>작성일 {item.c_date} {item.c_time}</span>
							</div>
						</div>
					</div>
					<div className="col-md-6 d-flex justify-content-end gap-2 mt-3 mt-md-0">
						{isAdmin && (
							<button
								className="btn btn-outline-primary btn-sm"
								onClick={() => navigate(`/${layout}/${type}/write`, { state: { id: item.id, actType: 'edit' } })}
							>
								<i className="bi bi-pencil-square me-1"></i>수정
							</button>
						)}
						<button
							className="btn btn-outline-secondary btn-sm"
							onClick={() => navigate(`/${layout}/${type}/list`)}
						>
							<i className="bi bi-list-ul me-1"></i>목록
						</button>
					</div>
				</div>
			</div>
		</article>
	);
};

export default DetailPageLayout;
