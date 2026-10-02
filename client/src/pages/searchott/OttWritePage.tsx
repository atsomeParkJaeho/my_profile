import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import { getOttDetail, createOtt, updateOtt, deleteOtt } from '@api/ott';

const QUARTER_OPTIONS = ['1분기', '2분기', '3분기', '4분기'];

const PLATFORM_FIELDS = [
  { key: 'netflixLink',     label: '넷플릭스 링크' },
  { key: 'laftelLink',      label: '라프텔 링크' },
  { key: 'wavveLink',       label: '웨이브 링크' },
  { key: 'watchaLink',      label: '왓챠 링크' },
  { key: 'tvingLink',       label: '티빙 링크' },
  { key: 'coupangplayLink', label: '쿠팡플레이 링크' },
  { key: 'disneyplusLink',  label: '디즈니플러스 링크' },
];

export default function OttWritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const actType  = location.state?.actType ?? 'create';
  const itemId   = location.state?.id;
  const isEdit   = actType === 'edit' && !!itemId;

  const [title,   setTitle]   = useState('');
  const [year,    setYear]    = useState('2026');
  const [quarter, setQuarter] = useState('4분기');
  const [image,   setImage]   = useState('');
  const [links,   setLinks]   = useState<Record<string, string>>({
    netflixLink: '', laftelLink: '', wavveLink: '', watchaLink: '', tvingLink: '', coupangplayLink: '', disneyplusLink: '',
  });
  const [meta,    setMeta]    = useState<{ createdAt?: string; updatedAt?: string; createdBy?: string; updatedBy?: string }>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getOttDetail(itemId).then((data) => {
      if (data) {
        setTitle(data.title ?? '');
        setYear(data.year ?? '');
        setQuarter(data.quarter ?? '4분기');
        setImage(data.image ?? '');
        setLinks({
          netflixLink: data.netflixLink ?? '',
          laftelLink: data.laftelLink ?? '',
          wavveLink: data.wavveLink ?? '',
          watchaLink: data.watchaLink ?? '',
          tvingLink: data.tvingLink ?? '',
          coupangplayLink: data.coupangplayLink ?? '',
          disneyplusLink: data.disneyplusLink ?? '',
        });
        setMeta({
          createdAt: data.createdAt, updatedAt: data.updatedAt,
          createdBy: data.createdBy, updatedBy: data.updatedBy,
        });
      }
    }).finally(() => setLoading(false));
  }, [isEdit, itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const dto = { title: title.trim(), year, quarter, image, ...links };
      if (isEdit) {
        await updateOtt(itemId, dto);
      } else {
        await createOtt(dto);
      }
      navigate('/searchott');
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteOtt(itemId);
      navigate('/searchott');
    } catch (err) {
      console.error(err);
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="my-4">
        <div className="card card-body">
          <div className="border-bottom mb-4 pb-4">
            <h5 className="mb-1">{isEdit ? 'OTT 정보 수정' : 'OTT 정보 작성'}</h5>
            <p className="text-muted mb-0">내용을 입력하고 저장 버튼을 눌러주세요.</p>
            {isEdit && (meta.createdAt || meta.updatedAt) && (
              <p className="text-muted small mt-2 mb-0">
                {meta.createdBy && <>작성자 ID: {meta.createdBy} · </>}
                작성일: {meta.createdAt || '-'}
                {' · '}
                {meta.updatedBy && <>수정자 ID: {meta.updatedBy} · </>}
                수정일: {meta.updatedAt || '-'}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* 제목 */}
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">제목</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="작품 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 년도 */}
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">년도</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="예: 2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
              </div>

              {/* 방영분기 */}
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">방영분기</label>
                  <select
                    className="form-select"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                  >
                    {QUARTER_OPTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 이미지 */}
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">이미지 URL</label>
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="border rounded d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                      style={{ width: 90, height: 120, overflow: 'hidden' }}
                    >
                      {image ? (
                        <img src={image} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="bi bi-image text-muted" style={{ fontSize: '1.8rem' }} />
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="이미지 URL을 입력하세요"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* OTT 플랫폼 링크 */}
              {PLATFORM_FIELDS.map((field) => (
                <div className="col-md-6" key={field.key}>
                  <div className="form-group mb-3">
                    <label className="form-label">{field.label}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`${field.label} URL`}
                      value={links[field.key]}
                      onChange={(e) => setLinks((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm" /> : '저장'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/searchott')}>취소</button>
              {isEdit && (
                <button type="button" className="btn btn-outline-danger ms-auto" onClick={handleDelete}>삭제</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
