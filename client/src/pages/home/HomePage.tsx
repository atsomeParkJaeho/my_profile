import { useEffect, useRef, useState } from 'react';
import { compressImage } from '@/util/imageUtil';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import Layout from '@/componet/default/Layout';
import { getInfo, updateInfo, getCareers, createCareer, updateCareer, deleteCareer } from '@api/profile';

const EMPTY_INFO = { intro: '', phone: '', location: '', website: '', org: '', tech: '', sns_instar: '', sns_naver_blog: '', name: '', email: '', langue: '', school: '', birthday: '' };
const EMPTY_CAREER = { company: '', role: '', start_dt: '', end_dt: '', desc: '', order_no: 0, company_img: '' };
const MAX_IMG_SIZE = 5 * 1024 * 1024;

export default function HomePage() {
  const dispatch    = useAppDispatch();
  const { user }    = useAppSelector((state) => state.auth);
  const isAdmin     = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const initialized = useRef(false);

  const [info,     setInfo]     = useState(EMPTY_INFO);
  const [careers,  setCareers]  = useState<any[]>([]);
  const [infoEdit, setInfoEdit] = useState(false);
  const [saving,   setSaving]   = useState(false);

  // 커리어 모달 상태
  const [careerModal, setCareerModal] = useState<{ open: boolean; data: any; id: number | null }>({
    open: false, data: { ...EMPTY_CAREER }, id: null,
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    getInfo().then((d) => d && setInfo({ name: user?.name ?? '', email: user?.email ?? '', ...d })).catch(console.error);
    getCareers().then(setCareers).catch(console.error);
  }, [dispatch]);

  // ── myself_info 저장 ──
  const handleInfoSave = async () => {
    setSaving(true);
    try {
      await updateInfo(info);
      setInfoEdit(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // ── 커리어 저장 ──
  const handleCareerSave = async () => {
    const { data, id } = careerModal;
    try {
      if (id) {
        await updateCareer(id, data);
        setCareers((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c)
          .sort((a, b) => a.order_no - b.order_no));
      } else {
        await createCareer(data);
        const fresh = await getCareers();
        setCareers(fresh);
      }
      setCareerModal({ open: false, data: { ...EMPTY_CAREER }, id: null });
    } catch (err) { console.error(err); }
  };

  const handleCareerDelete = async (id: number) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await deleteCareer(id);
    setCareers((prev) => prev.filter((c) => c.id !== id));
  };

  const openCareerModal = (career?: any) => {
    setCareerModal({
      open: true,
      data: career ? { company: career.company, role: career.role, start_dt: career.start_dt, end_dt: career.end_dt, desc: career.desc, order_no: career.order_no, company_img: career.company_img ?? '' } : { ...EMPTY_CAREER },
      id: career?.id ?? null,
    });
  };

  const handleCareerImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMG_SIZE) { alert('5MB 이하의 이미지만 업로드할 수 있습니다.'); e.target.value = ''; return; }
    try {
      const base64 = await compressImage(file, 0.8);
      setCareerModal((prev) => ({ ...prev, data: { ...prev.data, company_img: base64 } }));
    } catch (err) { console.error(err); }
    finally { e.target.value = ''; }
  };

  console.log(`home page render: ${new Date().toISOString()}`);


  return (
    <Layout>
      <div className="profile-content-area my-4 card card-body">

        {/* ── PDF 인쇄 버튼 ── */}
        <div className="d-flex justify-content-end mb-3 btn-print-profile">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>PDF 저장 / 인쇄
          </button>
        </div>

        {/* ── 프로필 소개 + 상세정보 + SNS ── */}
        <div className="border-bottom mb-4 pb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 className="mb-1">안녕하세요, {user?.name ?? '방문자'} 님</h4>
              <h6 className="text-muted fw-normal mb-2">{info?.email}</h6>
            </div>
            {isAdmin && (
              <div className="ms-3 flex-shrink-0 profile-admin-actions">
                {infoEdit ? (
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleInfoSave} disabled={saving}>저장</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setInfoEdit(false)}>취소</button>
                  </div>
                ) : (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setInfoEdit(true)}>
                    <i className="bi bi-pencil me-1"></i>수정
                  </button>
                )}
              </div>
            )}
          </div>

          

          {/* 상세 정보 */}
          <div className="row mb-4">
            <InfoItem icon="bi-person"       label="이름"     value={info.name}     editMode={infoEdit} onChange={(v) => setInfo({ ...info, name: v })}     placeholder="이름" />
            <InfoItem icon="bi-envelope"     label="이메일"   value={info.email}    editMode={infoEdit} onChange={(v) => setInfo({ ...info, email: v })}    placeholder="이메일" />
            <InfoItem icon="bi-phone"        label="연락처"   value={info.phone}    editMode={infoEdit} onChange={(v) => setInfo({ ...info, phone: v })}    placeholder="연락처" />
            <InfoItem icon="bi-map"          label="주소"     value={info.location} editMode={infoEdit} onChange={(v) => setInfo({ ...info, location: v })} placeholder="주소" />
            <InfoItem icon="bi-link"         label="웹사이트" value={info.website}  editMode={infoEdit} onChange={(v) => setInfo({ ...info, website: v })}  placeholder="URL" />
            <InfoItem icon="bi-building"     label="소속"     value={info.org}      editMode={infoEdit} onChange={(v) => setInfo({ ...info, org: v })}      placeholder="소속 조직" />
            <InfoItem icon="bi-tags"         label="기술스택" value={info.tech}     editMode={infoEdit} onChange={(v) => setInfo({ ...info, tech: v })}     placeholder="기술 스택" />
            <InfoItem icon="bi-translate"    label="언어"     value={info.langue}   editMode={infoEdit} onChange={(v) => setInfo({ ...info, langue: v })}   placeholder="사용 언어" />
            <InfoItem icon="bi-mortarboard"  label="학력"     value={info.school}   editMode={infoEdit} onChange={(v) => setInfo({ ...info, school: v })}   placeholder="학교명" />
            <InfoItem icon="bi-cake"         label="생년월일" value={info.birthday} editMode={infoEdit} onChange={(v) => setInfo({ ...info, birthday: v })} placeholder="YYYY.MM.DD" />
          </div>

          {/* SNS */}
          <h6 className="mb-3 fw-semibold">Social Link</h6>
          <div className="row">
            <InfoItem icon="bi-instagram" label="인스타그램"  value={info.sns_instar}     editMode={infoEdit} onChange={(v) => setInfo({ ...info, sns_instar: v })}     placeholder="인스타그램 URL" />
            <InfoItem icon="bi-journal"   label="네이버 블로그" value={info.sns_naver_blog} editMode={infoEdit} onChange={(v) => setInfo({ ...info, sns_naver_blog: v })} placeholder="블로그 URL" />
          </div>
        </div>

        {/* ── 커리어 ── */}
        <div className="border-bottom mb-4 pb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Career</h5>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => openCareerModal()}>
                <i className="bi bi-plus-lg me-1"></i>추가
              </button>
            )}
          </div>

          {careers.length === 0 ? (
            <p className="text-muted small">등록된 커리어가 없습니다.</p>
          ) : (
            careers.map((c) => (
              <div key={c.id} className="bg-light p-3 rounded mb-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center"
                    style={{width: 44, height: 44}}>
                    {c.company_img ? (
                      <img src={c.company_img} alt={c.company} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <div className="bg-primary text-white fw-bold d-flex align-items-center justify-content-center w-100 h-100">
                        {c.company?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="ps-3 flex-grow-1">
                    <h6 className="mb-0 fw-bold">{c.company}</h6>
                    <span className="small text-muted">{c.role}</span>
                  </div>
                  <div className="text-muted small text-end">
                    <div>{c.start_dt} ~ {c.end_dt || '재직 중'}</div>
                    {isAdmin && (
                      <div className="d-flex gap-2 justify-content-end mt-1 profile-admin-actions">
                        <button className="btn btn-outline-primary btn-sm py-0" onClick={() => openCareerModal(c)}>수정</button>
                        <button className="btn btn-outline-danger btn-sm py-0" onClick={() => handleCareerDelete(c.id)}>삭제</button>
                      </div>
                    )}
                  </div>
                </div>
                {c.desc && <p className="mb-0 small text-muted" style={{whiteSpace: 'pre-wrap'}}>{c.desc}</p>}
              </div>
            ))
          )}
        </div>
        {/*자기 소개*/}
        {/* 자기소개 */}
        <div className="border-bottom mb-4 pb-4">
          {infoEdit ? (
            <textarea className="form-control mb-4" rows={3} placeholder="자기소개를 입력하세요"
                      value={info.intro} onChange={(e) => setInfo({ ...info, intro: e.target.value })} />
          ) : (
            <p className="text-muted mb-4" style={{ whiteSpace: 'pre-wrap' }}>{info.intro || '자기소개를 입력해주세요.'}</p>
          )}
        </div>
      </div>

      {/* ── 커리어 모달 ── */}
      {careerModal.open && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{careerModal.id ? '커리어 수정' : '커리어 추가'}</h5>
                <button className="btn-close" onClick={() => setCareerModal({ open: false, data: { ...EMPTY_CAREER }, id: null })} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">회사 이미지</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center bg-light border"
                        style={{width: 56, height: 56}}>
                        {careerModal.data.company_img ? (
                          <img src={careerModal.data.company_img} alt="회사" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        ) : (
                          <i className="bi bi-building text-muted" style={{fontSize: '1.4rem'}} />
                        )}
                      </div>
                      <div>
                        <label className="btn btn-outline-secondary btn-sm mb-1" style={{cursor: 'pointer'}}>
                          이미지 선택
                          <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleCareerImgChange} />
                        </label>
                        {careerModal.data.company_img && (
                          <button type="button" className="btn btn-outline-danger btn-sm ms-2 mb-1"
                            onClick={() => setCareerModal((p) => ({ ...p, data: { ...p.data, company_img: '' } }))}>
                            삭제
                          </button>
                        )}
                        <p className="text-muted small mb-0">5MB 이하</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">회사명</label>
                    <input className="form-control" value={careerModal.data.company}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, company: e.target.value } })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">직책 / 역할</label>
                    <input className="form-control" value={careerModal.data.role}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, role: e.target.value } })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">시작일</label>
                    <input className="form-control" placeholder="YYYY.MM" value={careerModal.data.start_dt}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, start_dt: e.target.value } })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">종료일</label>
                    <input className="form-control" placeholder="YYYY.MM (재직중이면 공란)" value={careerModal.data.end_dt}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, end_dt: e.target.value } })} />
                  </div>
                  <div className="col-4">
                    <label className="form-label">표시 순서</label>
                    <input type="number" className="form-control" value={careerModal.data.order_no}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, order_no: Number(e.target.value) } })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">상세 설명</label>
                    <textarea className="form-control" rows={4} value={careerModal.data.desc}
                      onChange={(e) => setCareerModal({ ...careerModal, data: { ...careerModal.data, desc: e.target.value } })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setCareerModal({ open: false, data: { ...EMPTY_CAREER }, id: null })}>취소</button>
                <button className="btn btn-primary" onClick={handleCareerSave}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function InfoItem({ icon, label, value, editMode, onChange, placeholder }: {
  icon: string; label: string; value: string; editMode: boolean;
  onChange?: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="col-md-4 my-2">
      <div className="d-flex">
        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary flex-shrink-0 mt-1"
          style={{width: 40, height: 40}}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div className="ps-3">
          <div className="fw-semibold mb-1" style={{fontSize: '0.85rem'}}>{label}</div>
          {editMode && onChange ? (
            <input type="text" className="form-control form-control-sm" value={value}
              onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
          ) : (
            <span className="text-muted small">{value || '-'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
