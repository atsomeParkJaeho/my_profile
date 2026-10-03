import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderMenu from './HeaderMenu';
import LeftMenu from './LeftMenu';
import { MobileMenuList } from '@/util/routeUtil';
import '@styles/componet/layout.css';

export const Layout = ({ children }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNavRef = useRef<HTMLElement>(null);
  const [mobileNavHeight, setMobileNavHeight] = useState(0);

  useEffect(() => {
    const el = mobileNavRef.current;
    if (!el) return;
    const update = () => setMobileNavHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* 고정 헤더 */}
      <HeaderMenu />
      {/* navbar 높이 spacer */}
      <div style={{ height: 56 }} />
      {/* 배너 */}
      {/* <div className="bg-primary" style={{height: 200}} /> */}
      {/* 본문 */}
      <section className="layout-section" style={{flex: 1}}>
        <div
          className="container py-4 pb-mobile-nav"
          style={{ '--mobile-nav-h': `${mobileNavHeight}px` } as React.CSSProperties}
        >
          <div className="row align-items-start">
            {/* 좌측 사이드바 */}
            <div className={`col-lg-4 col-xl-3 d-none d-lg-block`}>
              <LeftMenu />
            </div>
            {/* 우측 콘텐츠 */}
            <div className="col-lg-8 col-xl-9">
              {children}
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 전용 하단 메뉴 */}
      <nav ref={mobileNavRef} className="d-lg-none fixed-bottom bg-white border-top d-flex">
        {MobileMenuList?.map((item, idx) => {
          const active = location.pathname.startsWith(item?.activePrefix ?? item?.to);
          return (
            <button
              key={idx}
              onClick={() => navigate(item?.to)}
              className={`btn flex-fill d-flex flex-column align-items-center justify-content-center py-2 rounded-0 ${active ? 'text-primary' : 'text-secondary'}`}
            >
              <i className={`bi ${item?.icon} fs-5`}></i>
              <span className="small mt-1">{item?.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
