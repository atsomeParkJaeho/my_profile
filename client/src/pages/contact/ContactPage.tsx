import { useState } from 'react';
import Layout from '@/componet/default/Layout';
import { sendContact } from '@api/contact';

const EMPTY = { name: '', email: '', phone: '', message: '' };

export default function ContactPage() {
	const [form,       setForm]       = useState({ ...EMPTY });
	const [submitting, setSubmitting] = useState(false);
	const [success,    setSuccess]    = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
			alert('이름, 이메일, 메시지는 필수 입력 항목입니다.');
			return;
		}
		try {
			setSubmitting(true);
			await sendContact({ name: form.name, email: form.email, phone: form.phone, message: form.message });
			setSuccess(true);
			setForm({ ...EMPTY });
		} catch (err) {
			console.error(err);
			alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Layout>
			<div className="row justify-content-center my-4">
				<div className="col-lg-10">

					{/* 헤더 */}
					<div className="text-center mb-5">
						<h3 className="mb-2">문의하기</h3>
						<p className="text-muted">궁금하신 점이나 제안 사항을 자유롭게 남겨주세요. 빠르게 답변드리겠습니다.</p>
					</div>

					{/* 성공 메시지 */}
					{success && (
						<div className="alert alert-success mb-4" role="alert">
							<i className="bi bi-check-circle me-2"></i>
							메시지가 성공적으로 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.
							<button className="btn btn-sm btn-outline-success ms-3" onClick={() => setSuccess(false)}>
								새 문의 작성
							</button>
						</div>
					)}

					{/* 폼 카드 */}
					<div className="card shadow">
						<div className="card-body p-4 p-lg-5">
							<form onSubmit={handleSubmit}>
								<div className="row g-3">

									{/* 왼쪽: 이름 / 이메일 / 전화번호 */}
									<div className="col-md-6">
										<div className="form-group mb-3">
											<label className="form-label" htmlFor="c-name">이름 <span className="text-danger">*</span></label>
											<input
												id="c-name"
												type="text"
												className="form-control"
												placeholder="홍길동"
												value={form.name}
												onChange={(e) => setForm({ ...form, name: e.target.value })}
												maxLength={50}
												required
											/>
										</div>
										<div className="form-group mb-3">
											<label className="form-label" htmlFor="c-email">이메일 주소 <span className="text-danger">*</span></label>
											<input
												id="c-email"
												type="email"
												className="form-control"
												placeholder="name@example.com"
												value={form.email}
												onChange={(e) => setForm({ ...form, email: e.target.value })}
												required
											/>
										</div>
										<div className="form-group">
											<label className="form-label" htmlFor="c-phone">전화번호 (선택)</label>
											<input
												id="c-phone"
												type="tel"
												className="form-control"
												placeholder="010-0000-0000"
												value={form.phone}
												onChange={(e) => setForm({ ...form, phone: e.target.value })}
												maxLength={20}
											/>
										</div>
									</div>

									{/* 오른쪽: 메시지 */}
									<div className="col-md-6 d-flex flex-row">
										<div className="form-group w-100 d-flex flex-column">
											<label className="form-label" htmlFor="c-message">메시지 <span className="text-danger">*</span></label>
											<textarea
												id="c-message"
												className="form-control flex-grow-1"
												rows={7}
												placeholder="문의 내용을 입력해주세요."
												value={form.message}
												onChange={(e) => setForm({ ...form, message: e.target.value })}
												maxLength={2000}
												required
												style={{ resize: 'none' }}
											/>
										</div>
									</div>

									{/* 전송 버튼 */}
									<div className="col-12 pt-2">
										<button
											className="btn btn-primary"
											type="submit"
											disabled={submitting}
										>
											{submitting ? (
												<><span className="spinner-border spinner-border-sm me-2" />전송 중...</>
											) : (
												<><i className="bi bi-send me-2"></i>메시지 전송</>
											)}
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
