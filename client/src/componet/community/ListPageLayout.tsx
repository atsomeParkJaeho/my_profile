import { useEffect, useState } from 'react';
import { getCommunity, deleteCommunity } from "@api/community";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@store/hooks";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const ListPageLayout = ({ id, layout = 'community', type = 'default' }) => {
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

	const onHandleClick = () => {
		navigate(`/${layout}/${type}/write`, { state: { actType: 'create' } });
	};

	const onHandleDelete = async (itemId: number) => {
		if (!window.confirm('삭제하시겠습니까?')) return;
		try {
			await deleteCommunity(itemId);
			setList((prev) => prev.filter((item) => item.id !== itemId));
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div style={{ width: '100%', overflow: 'hidden' }}>
			{isAdmin && (
				<div className="d-flex justify-content-end mb-3">
					<button onClick={onHandleClick} className="btn btn-primary">글쓰기</button>
				</div>
			)}
			{loading ? (
				<div className="text-center py-4">로딩 중...</div>
			) : (
				<div className="table-responsive">
					<table className="table table-borderless community-table" style={{ tableLayout: 'fixed', width: '100%' }}>
						<colgroup>
							<col style={{ width: '5%' }} />
							<col style={{ width: isAdmin ? '25%' : '30%' }} />
							<col style={{ width: '15%' }} />
							<col style={{ width: '15%' }} />
							<col style={{ width: '15%' }} />
							<col style={{ width: '15%' }} />
							{isAdmin && <col style={{ width: '10%' }} />}
						</colgroup>
						<thead>
							<tr className="community-table-head-row">
								<th className="fw-bold py-3 text-center">#</th>
								<th className="fw-bold py-3 text-center">제목</th>
								<th className="fw-bold py-3 text-center">작성일시</th>
								<th className="fw-bold py-3 text-center">수정일시</th>
								<th className="fw-bold py-3 text-center">작성자</th>
								<th className="fw-bold py-3 text-center">수정자</th>
								{isAdmin && <th className="fw-bold py-3 text-center">관리</th>}
							</tr>
						</thead>
						<tbody>
							{list.length === 0 ? (
								<tr className="community-table-row">
									<td colSpan={isAdmin ? 7 : 6} className="text-center py-4 text-muted">
										등록된 게시글이 없습니다.
									</td>
								</tr>
							) : (
								list.map((item, index) => (
									<tr key={item.id} className="align-middle community-table-row">
										<td className="py-3 fw-bold text-center">{index + 1}</td>
										<td className="py-3 text-center">
											<span
												className="text-primary"
												style={{ cursor: 'pointer' }}
												onClick={() => navigate(`/${layout}/${type}/detail`, { state: { id: item.id } })}
											>
												{item.title}
											</span>
										</td>
										<td className="py-3 text-center">{item.c_date} {item.c_time}</td>
										<td className="py-3 text-center">{item.e_date} {item.e_time}</td>
										<td className="py-3 text-center">{item.c_user_name}</td>
										<td className="py-3 text-center">{item.e_user_name}</td>
										{isAdmin && (
											<td className="py-3 text-center">
												<button
													className="btn btn-sm btn-danger"
													onClick={() => onHandleDelete(item.id)}
												>삭제</button>
											</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default ListPageLayout;
