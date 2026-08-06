import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clientApi } from '@api/api';
import { useNavigate } from 'react-router-dom';
import { getCommunityDetail, updateCommunity } from '@api/community';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { compressImage } from '@/util/imageUtil';

const TOOLBAR_OPTIONS = [
	[{ header: [1, 2, 3, false] }],
	['bold', 'italic', 'underline', 'strike'],
	[{ color: [] }, { background: [] }],
	[{ list: 'ordered' }, { list: 'bullet' }],
	[{ align: [] }],
	['link', 'image'],
	['clean'],
];

const MAX_THUMB_SIZE = 5 * 1024 * 1024; // 5MB

const WritePageLayout = ({ id, actType, itemId, layout = 'community', type = 'default' }) => {
	const navigate      = useNavigate();
	const quillRef      = useRef<any>(null);
	const thumbRef      = useRef<HTMLInputElement>(null);
	const isEdit        = actType === 'edit';

	const [title,     setTitle]     = useState('');
	const [content,   setContent]   = useState('');
	const [thumbnail, setThumbnail] = useState(''); // extra1
	const [loading,   setLoading]   = useState(isEdit);

	// 에디터 내 이미지 업로드 핸들러
	const imageHandler = useCallback(() => {
		const input = document.createElement('input');
		input.type   = 'file';
		input.accept = 'image/*';
		input.click();
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const base64 = await compressImage(file, 0.7);
				const editor = quillRef.current?.getEditor();
				const range  = editor?.getSelection(true);
				editor?.insertEmbed(range.index, 'image', base64);
				editor?.setSelection(range.index + 1);
			} catch (err) {
				console.error('이미지 압축 실패', err);
			}
		};
	}, []);

	const modules = useMemo(() => ({
		toolbar: {
			container: TOOLBAR_OPTIONS,
			handlers:  { image: imageHandler },
		},
	}), [imageHandler]);

	const getReady = async () => {
		if (isEdit && itemId) {
			try {
				const data = await getCommunityDetail(itemId);
				if (data) {
					setTitle(data.title ?? '');
					setContent(data.content ?? '');
					setThumbnail(data.extra1 ?? '');
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		}
	};

	useEffect(() => { getReady(); }, []);

	// 썸네일 파일 선택
	const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_THUMB_SIZE) {
			alert('5MB 이하의 이미지만 업로드할 수 있습니다.');
			e.target.value = '';
			return;
		}
		try {
			const base64 = await compressImage(file, 0.8);
			setThumbnail(base64);
		} catch (err) {
			console.error('썸네일 압축 실패', err);
		} finally {
			e.target.value = '';
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (isEdit) {
				await updateCommunity(itemId, {
					title,
					content,
					e_user_name: id?.name ?? '',
					type,
					board_layout: layout,
					extra1: thumbnail,
				});
			} else {
				await clientApi.post('/community/create', {
					title,
					content,
					c_user_name: id?.name ?? '',
					type,
					board_layout: layout,
					extra1: thumbnail,
				});
			}
			navigate(`/${layout}/${type}/list`);
		} catch (err) {
			console.error(err);
		}
	};

	if (loading) return <div className="text-center py-5">로딩 중...</div>;

	return (
		<div className="profile-content-area my-6 card card-body">
			<div className="border-bottom mb-6 pb-6">
				<h5 className="mb-1">{isEdit ? '게시글 수정' : '게시글 작성'}</h5>
				<p className="text-muted mb-4">내용을 입력하고 저장 버튼을 눌러주세요.</p>

				<form onSubmit={handleSubmit}>
					<div className="row mb-4">

						{/* 제목 */}
						<div className="col-md-12">
							<div className="form-group mb-3">
								<label className="form-label">제목</label>
								<input
									type="text"
									placeholder="제목을 입력하세요"
									className="form-control"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
								/>
							</div>
						</div>

						{/* 작성자 */}
						<div className="col-md-6">
							<div className="form-group mb-3">
								<label className="form-label">{isEdit ? '수정자' : '작성자'}</label>
								<input
									type="text"
									className="form-control"
									value={id?.name ?? ''}
									readOnly
								/>
							</div>
						</div>

						{/* 썸네일 업로드 */}
						<div className="col-md-12">
							<div className="form-group mb-3">
								<label className="form-label">썸네일 이미지</label>
								<div className="d-flex align-items-start gap-3">
									{/* 미리보기 */}
									<div
										className="border rounded d-flex align-items-center justify-content-center bg-light flex-shrink-0"
										style={{ width: 120, height: 80, overflow: 'hidden', cursor: 'pointer' }}
										onClick={() => thumbRef.current?.click()}
									>
										{thumbnail ? (
											<img src={thumbnail} alt="썸네일" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
										) : (
											<i className="bi bi-image text-muted" style={{ fontSize: '1.8rem' }} />
										)}
									</div>
									<div>
										<button
											type="button"
											className="btn btn-outline-secondary btn-sm mb-1"
											onClick={() => thumbRef.current?.click()}
										>
											이미지 선택
										</button>
										{thumbnail && (
											<button
												type="button"
												className="btn btn-outline-danger btn-sm ms-2 mb-1"
												onClick={() => setThumbnail('')}
											>
												삭제
											</button>
										)}
										<p className="text-muted small mb-0">5MB 이하 · JPG/PNG/GIF</p>
									</div>
								</div>
								<input
									ref={thumbRef}
									type="file"
									accept="image/*"
									style={{ display: 'none' }}
									onChange={handleThumbnailChange}
								/>
							</div>
						</div>

						{/* 내용 */}
						<div className="col-md-12">
							<div className="form-group mb-3">
								<label className="form-label">내용</label>
								<ReactQuill
									ref={quillRef}
									theme="snow"
									value={content}
									onChange={setContent}
									modules={modules}
									style={{ height: '300px', marginBottom: '42px' }}
									placeholder="내용을 입력하세요"
								/>
							</div>
						</div>
					</div>

					<div className="d-flex gap-2">
						<button type="submit" className="btn btn-primary">저장</button>
						<button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>취소</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default WritePageLayout;
