import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout, withdraw } from '@store/authSlice';
import '@styles/componet/left_menu.css';
import { useEffect, useState } from 'react';
import { getInfo } from '@api/profile';
import {LeftMenuList} from "@/util/routeUtil";

export const LeftMenu = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  const [info, setInfo] = useState<{ name: string; email: string }>({ name: '', email: '' });

  useEffect(() => {
    getInfo()
      .then((d) => {
        if (d) setInfo({
          name:  d.name  || user?.name  || '',
          email: d.email || user?.email || '',
        });
      })
      .catch(console.error);
  }, []);

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
          <div
            className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3 fw-bold"
            style={{width: 80, height: 80, fontSize: '2rem'}}
          >
            {info.name?.charAt(0) ?? '?'}
          </div>
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
          {LeftMenuList?.map((item,idx)=>{
            
            let active = location.pathname.startsWith(item?.activePrefix ?? item?.to) ? 'active' : ''
            
            return (
              <button
                onClick={() => navigate(item?.to)}
                className={`list-group-item list-group-item-action d-flex justify-content-between py-3 ${active}`}
              >
                <div><i className={`bi ${item?.icon} me-2`}></i><span>{item?.name}</span></div>
                <i className={`bi bi-chevron-right`}></i>
              </button>
            )
          })}
          {/*<button*/}
          {/*  onClick={() => navigate('/community/list')}*/}
          {/*  className={`list-group-item list-group-item-action d-flex justify-content-between py-3 ${location.pathname.startsWith('/community') ? 'active' : ''}`}*/}
          {/*>*/}
          {/*  <div><i className="bi bi-journal-text me-2"></i><span>게시판</span></div>*/}
          {/*  <i className="bi bi-chevron-right"></i>*/}
          {/*</button>*/}
          {/* 추후 메뉴 항목 추가 예정 */}
        </div>
      </div>
    </div>
  );
};

export default LeftMenu;
