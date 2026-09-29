import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import { getCommunity } from '@api/community';
import { useAppSelector } from '@store/hooks';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const LAYOUT = 'gallery';
const TYPE   = 'ott_list';

// HTML 태그 제거 후 지정 길이만큼 잘라 반환
const stripHtml = (html: string, max = 80) => {
  const text = html?.replace(/<[^>]*>/g, '') ?? '';
  return text.length > max ? text.slice(0, max) + '…' : text;
};

export default function SearchOttPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === ADMIN_EMAIL;

  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal,  setInputVal]  = useState(searchParams.get('q') ?? '');
  const [keyword,   setKeyword]   = useState('');
  const [allItems,  setAllItems]  = useState<any[]>([]);
  const [items,     setItems]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [searched,  setSearched]  = useState(false);

  useEffect(() => {
    getCommunity(LAYOUT, TYPE).then((res) => {
      const list = res ?? [];
      setAllItems(list);
      const q = searchParams.get('q');
      if (q) {
        setKeyword(q);
        setItems(list.filter((item: any) => item.title?.includes(q)));
      } else {
        setItems(list);
      }
      setLoading(false);
      setSearched(true);
    });
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputVal.trim();
    setKeyword(q);
    setSearchParams(q ? { q } : {});
    setItems(q ? allItems.filter((item) => item.title?.includes(q)) : allItems);
    setSearched(true);
  };

  const handleReset = () => {
    setInputVal('');
    setKeyword('');
    setItems(allItems);
    setSearched(true);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="my-4">

        {/* ── 검색 헤더 ── */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-tv me-2 text-primary"></i>OTT 정보
            </h5>
            {isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/${LAYOUT}/${TYPE}/write`, { state: { actType: 'create' } })}
              >
                <i className="bi bi-pencil-square me-1"></i>글쓰기
              </button>
            )}
          </div>
          <p className="text-muted small mb-3">보고 싶은 콘텐츠를 검색하고 OTT 정보를 확인하세요.</p>
          <form className="d-flex flex-row mb-2 p-1 bg-white border rounded input-group" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control rounded-0 border-0"
              placeholder="콘텐츠명 검색..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button className="btn btn-primary rounded-0 flex-shrink-0" type="submit" disabled={loading}>
              <i className="bi bi-search me-1"></i>검색
            </button>
          </form>
        </div>

        {/* ── 결과 헤더 ── */}
        {searched && (
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <span className="text-muted small">
              {keyword
                ? <><strong>"{keyword}"</strong> 검색 결과 · 총 <strong>{items.length}</strong>건</>
                : <>전체 · 총 <strong>{items.length}</strong>건</>
              }
            </span>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
              <i className="bi bi-x-circle me-1"></i>초기화
            </button>
          </div>
        )}

        {/* ── 로딩 ── */}
        {loading && (
          <div className="card card-body text-center py-5 text-muted">
            <div className="spinner-border text-primary mx-auto mb-3" style={{ width: 40, height: 40 }} />
            <p className="mb-0">OTT 정보를 불러오는 중...</p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {!loading && searched && items.length === 0 && (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">등록된 게시글이 없습니다.</p>
          </div>
        )}

        {/* ── 갤러리 결과 ── */}
        {!loading && items.length > 0 && (
          <div className="row g-3">
            {items.map((item) => (
              <div key={item.id} className="col-sm-6 col-lg-4 col-xl-3">
                <div
                  className="card hover-scale overflow-hidden"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/${LAYOUT}/${TYPE}/detail`, { state: { id: item.id } })}
                >
                  {/* 콘텐츠 이미지 */}
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{ position: 'relative', paddingTop: '100%' }}
                  >
                    {item.extra1 ? (
                      <img
                        className="card-img-top"
                        src={item.extra1}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', left: 0, top: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                  </div>

                  <div className="card-body p-3">
                    {/* <div className="nav">
                      <span className="small fw-600 me-2 text-primary">{item.c_user_name} · {item.c_date}</span>
                    </div> */}
                    <h5 className="mt-1 mb-0 text-reset" style={{ fontSize: '1rem' }}>{item.title}</h5>
                    <p className="text-muted small mt-1 mb-0" style={{ lineHeight: 1.5 }}>
                      {stripHtml(item.content)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
