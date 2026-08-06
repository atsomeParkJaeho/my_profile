import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout, withdraw } from '@store/authSlice';
import '@styles/componet/left_menu.css';
import { useEffect, useRef, useState } from 'react';
import { getInfo } from '@api/profile';
import { updateProfileImage } from '@api/api';
import { compressImage } from '@/util/imageUtil';
import { LeftMenuList } from '@/util/routeUtil';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const LeftMenu = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const fileRef  = useRef<HTMLInputElement>(null);

  const [info,    setInfo]    = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [imgSrc,  setImgSrc]  = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getInfo()
      .then((d) => {
        if (d) {
          setInfo({ name: d.name || user?.name || '', email: d.email || user?.email || '' });
          if (d.profileImage) setImgSrc(d.profileImage);
        }
      })
      .catch(console.error);
  }, []);

  const handleImageClick = () => {
    if (isAdmin) fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      alert('5MB 이하의 이미지만 업로드할 수 있습니다.');
      return;
    }
    try {
      setUploading(true);
      const base64 = await compressImage(file, 0.8);
      await updateProfileImage(base64);
      setImgSrc(base64);
    } catch (err) {
      console.error(err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleWithdraw = async () => {
    if (!window.confirm('정말 탈퇴하시겠습니까?')) return;
    try { await dispatch(withdraw()); } catch { alert('탈퇴 처리 중 오류가 발생했습니다.'); }
  };

  return (
    <div className="col-lg-12 col-xl-12">
      {/* 프로필 카드 */}
      <div className="card mb-4">
        <div className="p-4 text-center">

          {/* 프로필 이미지 */}
          <div
            onClick={handleImageClick}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem', position: 'relative',
              cursor: isAdmin ? 'pointer' : 'default',
              overflow: 'hidden',
            }}
          >
            {imgSrc ? (
              <img src={imgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div
                className="bg-primary text-white fw-bold"
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}
              >
                {info.name?.charAt(0) ?? '?'}
              </div>
            )}
            {isAdmin && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                color: '#fff', fontSize: '0.6rem', padding: '3px 0',
                textAlign: 'center',
              }}>
                {uploading ? '...' : '변경'}
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <h6 className="fw-bold mb-0">{info.name || '-'}</h6>
          <span className="small text-muted">{info.email || '-'}</span>
          {isAdmin && (
            <div className="mt-3 d-flex justify-content-center gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>로그아웃</button>
              <button className="btn btn-outline-danger btn-sm" onClick={handleWithdraw}>회원탈퇴</button>
            </div>
          )}
        </div>
      </div>

      {/* 사이드 메뉴 */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="my-2">메뉴</h6>
        </div>
        <div className="list-group list-group-flush">
          {LeftMenuList?.map((item, idx) => {
            const active = location.pathname.startsWith(item?.activePrefix ?? item?.to) ? 'active' : '';
            return (
              <button
                key={idx}
                onClick={() => navigate(item?.to)}
                className={`list-group-item list-group-item-action d-flex justify-content-between py-3 ${active}`}
              >
                <div><i className={`bi ${item?.icon} me-2`}></i><span>{item?.name}</span></div>
                <i className="bi bi-chevron-right"></i>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeftMenu;
