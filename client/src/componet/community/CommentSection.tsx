import { useEffect, useRef, useState } from 'react';
import { getComments, createComment, deleteComment } from '@api/comment';
import {
	loadCaptchaEnginge,
	LoadCanvasTemplate,
	validateCaptcha,
} from 'react-simple-captcha';

const EMPTY_FORM = { name: '', password: '', content: '', captcha: '' };

const CommentSection = ({ postId }: { postId: number }) => {
	const [comments, setComments] = useState<any[]>([]);
	const [form,     setForm]     = useState({ ...EMPTY_FORM });
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
		<div className="mt-4">
			<h6 className="fw-bold mb-3">
				댓글 <span className="text-muted fw-normal small">({comments.length})</span>
			</h6>

			{/* 댓글 목록 */}
			{comments.length === 0 ? (
				<p className="text-muted small mb-4">첫 번째 댓글을 남겨보세요.</p>
			) : (
				<ul className="list-unstyled mb-4">
					{comments.map((c) => (
						<li key={c.id} className="border-bottom py-3">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<span className="fw-semibold small me-2">{c.name}</span>
									<span className="text-muted" style={{ fontSize: '0.75rem' }}>
										{c.c_date} {c.c_time}
									</span>
								</div>
								<button
									className="btn btn-link btn-sm text-danger p-0"
									style={{ fontSize: '0.75rem' }}
									onClick={() => setDelTarget({ id: c.id, pw: '' })}
								>
									삭제
								</button>
							</div>
							<p className="mb-0 small mt-1" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>
						</li>
					))}
				</ul>
			)}

			{/* 댓글 삭제 비밀번호 확인 */}
			{delTarget && (
				<div className="alert alert-warning d-flex gap-2 align-items-center mb-3">
					<input
						type="password"
						className="form-control form-control-sm"
						placeholder="비밀번호 입력"
						value={delTarget.pw}
						onChange={(e) => setDelTarget({ ...delTarget, pw: e.target.value })}
						style={{ maxWidth: 180 }}
					/>
					<button className="btn btn-sm btn-danger" onClick={handleDelete}>확인</button>
					<button className="btn btn-sm btn-secondary" onClick={() => setDelTarget(null)}>취소</button>
				</div>
			)}

			{/* 댓글 작성 폼 */}
			<form onSubmit={handleSubmit}>
				<div className="row g-2 mb-2">
					<div className="col-6 col-md-3">
						<input
							className="form-control form-control-sm"
							placeholder="이름"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							maxLength={30}
						/>
					</div>
					<div className="col-6 col-md-3">
						<input
							type="password"
							className="form-control form-control-sm"
							placeholder="비밀번호"
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							maxLength={30}
						/>
					</div>
				</div>
				<textarea
					className="form-control form-control-sm mb-2"
					rows={3}
					placeholder="댓글을 입력하세요"
					value={form.content}
					onChange={(e) => setForm({ ...form, content: e.target.value })}
					maxLength={500}
				/>

				{/* 자동입력 방지 */}
				<div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
					<LoadCanvasTemplate reloadText="새로고침" />
					<input
						className="form-control form-control-sm"
						placeholder="위 코드 입력"
						value={form.captcha}
						onChange={(e) => setForm({ ...form, captcha: e.target.value })}
						style={{ maxWidth: 140 }}
					/>
				</div>

				<button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
					{submitting ? '등록 중...' : '댓글 등록'}
				</button>
			</form>
		</div>
	);
};

export default CommentSection;
