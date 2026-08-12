import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import axios from 'axios';

interface SearchItem {
  title: string;
  img: string;
  price: number;
  yen: number;
  html: string;
}

export default function PriceFindPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal, setInputVal] = useState(searchParams.get('q') ?? '');
  const [keyword,  setKeyword]  = useState('');
  const [items,    setItems]    = useState<SearchItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchSearch = async (q: string) => {
    setKeyword(q);
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await axios.get<{ items: SearchItem[]; total: number }>(
        '/api/pricefind/search', { params: { q } }
      );
      setItems(data.items ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // 새로고침 시 URL의 q 파라미터로 자동 검색
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) fetchSearch(q);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    setSearchParams({ q });
    await fetchSearch(q);
  };

  const handleReset = () => {
    setInputVal('');
    setKeyword('');
    setItems([]);
    setSearched(false);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="my-4">

        {/* ── 검색 헤더 ── */}
        <div className="card card-body mb-4">
          <h5 className="fw-bold mb-1">
            <i className="bi bi-search me-2 text-primary"></i>가격 비교
          </h5>
          <p className="text-muted small mb-3">원하는 상품을 검색하고 최저가를 확인하세요.</p>
          <form className="d-flex input-group" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control"
              placeholder="상품명 검색..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button className="btn btn-primary flex-shrink-0" type="submit" disabled={loading}>
              {loading
                ? <span className="spinner-border spinner-border-sm" />
                : <><i className="bi bi-search me-1"></i>검색</>
              }
            </button>
          </form>
        </div>

        {/* ── 결과 헤더 ── */}
        {searched && (
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <span className="text-muted small">
              <strong className="text-dark">"{keyword}"</strong> 검색 결과 · 총 <strong>{items.length}</strong>건
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
            <p className="mb-0">네이버 스토어에서 검색 중...</p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {!loading && searched && items.length === 0 && (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* ── 갤러리 결과 ── */}
        {!loading && items.length > 0 && (
          <div className="row g-3">
            {items.map((item, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div
                  className="card h-100 shadow-sm"
                  style={{ transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.13)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  {/* 상품 이미지 */}
                  <div
                    className="d-flex align-items-center justify-content-center bg-light rounded-top overflow-hidden"
                    style={{ height: 160 }}
                  >
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <i className="bi bi-box text-secondary" style={{ fontSize: '3rem' }}></i>
                    )}
                  </div>

                  <div className="card-body p-3 d-flex flex-column">
                    <h6
                      className="fw-bold mb-3 text-dark"
                      style={{
                        fontSize: '0.88rem', lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </h6>

                    <div className="mt-auto border-top pt-2">
                      <div className="d-flex justify-content-between align-items-end">
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>한국 가격</div>
                          <div className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                            {item.price > 0 ? `₩${item.price.toLocaleString()}` : '가격 미제공'}
                          </div>
                        </div>
                        {item.yen > 0 && (
                          <div className="text-end">
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>엔화 환산</div>
                            <div className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>
                              ¥{Math.round(item.yen).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
