import HeaderMenu from './HeaderMenu';
import LeftMenu from './LeftMenu';
import '@styles/componet/layout.css';

export const Layout = ({ children }: any) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* 고정 헤더 */}
      <HeaderMenu />
      {/* navbar 높이 spacer */}
      <div style={{ height: 56 }} />
      {/* 배너 */}
      <div className="bg-primary" style={{height: 200}} />
      {/* 본문 */}
      <section style={{backgroundColor: '#f8f9fa', flex: 1}}>
        <div className="container py-4">
          <div className="row align-items-start">
            {/* 좌측 사이드바 */}
            <div className={`col-lg-4 col-xl-3`} style={{marginTop: '-80px'}}>
              <LeftMenu />
            </div>
            {/* 우측 콘텐츠 */}
            <div className="col-lg-8 col-xl-9">
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Layout;
