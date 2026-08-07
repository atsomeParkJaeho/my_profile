import { useEffect, useState } from 'react';
import { getComments, createComment, deleteComment } from '@api/comment';
import {
	loadCaptchaEnginge,
	LoadCanvasTemplate,
	validateCaptcha,
} from 'react-simple-captcha';

const EMPTY_FORM = { name: '', password: '', content: '', captcha: '' };

const CommentSection = ({ postId }: { postId: number }) => {
	const [comments,   setComments]   = useState<any[]>([]);
	const [form,       setForm]       = useState({ ...EMPTY_FORM });
	const [submitting, setSubmitting] = useState(false);
	const [delTarget,  setDelTarget]  = useState<{ id: number; pw: string } | null>(null);

	useEffect(() => {
		getComments(postId).then(setComments).catch(console.error);
	}, [postId]);

	useEffect(() => {
		loadCaptchaEnginge(6);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateCaptcha(form.captcha)) {
			alert('자동입력 방지 코드가 일치하지 않습니다. 다시 확인해주세요.');
			setForm((p) => ({ ...p, captcha: '' }));
			loadCaptchaEnginge(6);
			return;
		}
		if (!form.name.trim() || !form.password.trim() || !form.content.trim()) {
			alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
			return;
		}
		try {
			setSubmitting(true);
			await createComment({ postId, name: form.name, password: form.password, content: form.content });
			const fresh = await getComments(postId);
			setComments(fresh);
			setForm({ ...EMPTY_FORM });
			loadCaptchaEnginge(6);
		} catch (err) {
			console.error(err);
			alert('댓글 등록에 실패했습니다.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!delTarget) return;
		try {
			await deleteComment(delTarget.id, delTarget.pw);
			setComments((prev) => prev.filter((c) => c.id !== delTarget.id));
			setDelTarget(null);
		} catch {
			alert('비밀번호가 일치하지 않습니다.');
		}
	};

	return (
		<>
			{/* ── 댓글 목록 ── */}
			<div className="card card-body mt-4">
				<h4>Comments <span className="text-muted fs-6 fw-normal">({comments.length})</span></h4>

				{comments.length === 0 ? (
					<p className="text-muted small pt-3 mb-0">첫 번째 댓글을 남겨보세요.</p>
				) : (
					<ul className="list-unstyled pt-4 mb-0">
						{comments.map((c, idx) => (
							<li key={c.id} className={`d-flex ${idx !== 0 ? 'mt-4 pt-4 border-top' : ''}`}>
								{/* 아바타 이니셜 */}
								<div
									className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
									style={{ width: 44, height: 44, fontSize: '1rem' }}
								>
									{c.name?.charAt(0)?.toUpperCase() ?? '?'}
								</div>

								<div className="col ps-3">
									<div className="d-flex justify-content-between align-items-center mb-1">
										<h6 className="mt-0 mb-0">{c.name}</h6>
										<span className="text-muted" style={{ fontSize: '0.75rem' }}>
											{c.c_date} {c.c_time}
										</span>
									</div>
									<p className="mb-2 small" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>

									{/* 삭제 버튼 */}
									{delTarget?.id === c.id ? (
										<div className="d-flex align-items-center gap-2 mt-2">
											<input
												type="password"
												className="form-control form-control-sm"
												placeholder="비밀번호 입력"
												value={delTarget.pw}
												autoFocus
												onChange={(e) => setDelTarget({ ...delTarget, pw: e.target.value })}
												onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
												style={{ maxWidth: 160 }}
											/>
											<button className="btn btn-sm btn-danger" onClick={handleDelete}>확인</button>
											<button className="btn btn-sm btn-secondary" onClick={() => setDelTarget(null)}>취소</button>
										</div>
									) : (
										<div className="nav links-dark">
											<button
												className="btn btn-link btn-sm p-0 text-muted"
												style={{ fontSize: '0.8rem', textDecoration: 'none' }}
												onClick={() => setDelTarget({ id: c.id, pw: '' })}
											>
												<i className="bi bi-trash me-1"></i>삭제
											</button>
										</div>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* ── 댓글 작성 폼 ── */}
			<div className="card card-body my-4">
				<h4 className="mb-4">Leave A Comment</h4>
				<form onSubmit={handleSubmit}>
					<div className="row">
						<div className="col-sm-6">
							<div className="form-group mb-3">
								<label className="form-label">이름</label>
								<input
									type="text"
									className="form-control"
									placeholder="이름을 입력하세요"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									maxLength={30}
								/>
							</div>
						</div>
						<div className="col-sm-6">
							<div className="form-group mb-3">
								<label className="form-label">비밀번호</label>
								<input
									type="password"
									className="form-control"
									placeholder="삭제 시 사용할 비밀번호"
									value={form.password}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
									maxLength={30}
								/>
							</div>
						</div>
						<div className="col-12">
							<div className="form-group mb-3">
								<label className="form-label">댓글 내용</label>
								<textarea
									className="form-control"
									rows={6}
									placeholder="댓글을 입력하세요"
									value={form.content}
									onChange={(e) => setForm({ ...form, content: e.target.value })}
									maxLength={500}
								/>
							</div>
						</div>

						{/* 자동입력 방지 */}
						<div className="col-12 mb-3">
							<label className="form-label">자동입력 방지</label>
							<div className="d-flex align-items-center gap-3 flex-wrap">
								<LoadCanvasTemplate reloadText="새로고침" />
								<input
									className="form-control"
									placeholder="위 코드를 입력하세요"
									value={form.captcha}
									onChange={(e) => setForm({ ...form, captcha: e.target.value })}
									style={{ maxWidth: 180 }}
								/>
							</div>
						</div>

						<div className="col-12">
							<button className="btn btn-primary w-100" type="submit" disabled={submitting}>
								{submitting ? '등록 중...' : '댓글 등록'}
							</button>
						</div>
					</div>
				</form>
			</div>
		</>
	);
};

export default CommentSection;
