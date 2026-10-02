import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import { useAppSelector } from '@store/hooks';
import axios from 'axios';

interface SearchItem {
  title: string;
  link: string;
}

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const LAYOUT = 'gallery';
const TYPE   = 'ott_list';

const CATEGORIES = [
  { label: '전체' },
  { label: '영화' },
  { label: '드라마' },
  { label: '예능' },
];

const SEASONS = [
  { id: 'season_1', label: '2026년 1분기' },
  { id: 'season_2', label: '2026년 2분기' },
  { id: 'season_3', label: '2026년 3분기' },
  { id: 'season_4', label: '2026년 4분기' },
];

// 현재 월 기준 분기를 맨 위로, 나머지는 숫자 내림차순 정렬
const getOrderedSeasons = () => {
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  const rest = SEASONS
    .filter((s) => s.id !== `season_${currentQuarter}`)
    .sort((a, b) => Number(b.id.split('_')[1]) - Number(a.id.split('_')[1]));
  const current = SEASONS.find((s) => s.id === `season_${currentQuarter}`);
  return current ? [current, ...rest] : rest;
};

export default function SearchOttPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === ADMIN_EMAIL;

  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal,  setInputVal]  = useState(searchParams.get('q') ?? '');
  const [keyword,   setKeyword]   = useState('');
  const [items,     setItems]     = useState<SearchItem[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number] | null>(
    CATEGORIES.find((cat) => cat.label === '전체') ?? null
  );

  const fetchSearch = async (q: string) => {
    setKeyword(q);
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await axios.get<{ items: SearchItem[]; total: number }>(
        '/api/searchott/search', { params: { q } }
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
    const params: Record<string, string> = { q };
    if (selectedCategory && selectedCategory.label !== '전체') params.category = selectedCategory.label;
    setSearchParams(params);
    await fetchSearch(q);
  };

  const handleReset = () => {
    setInputVal('');
    setKeyword('');
    setItems([]);
    setSearched(false);
    setSelectedCategory(CATEGORIES.find((cat) => cat.label === '전체') ?? null);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="my-4">

        {/* ── 검색 헤더 ── */}
        <div className="card card-body mb-4">
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
          <form className="d-flex input-group" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control"
              placeholder="콘텐츠명 검색..."
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

          {/* 카테고리 버튼 */}
          <div className="mt-3">
            <p className="text-muted small mb-2">카테고리 선택 후 검색버튼을 클릭하세요.</p>
            <div className="d-flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory?.label === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                    disabled={loading}
                    onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  >
                    {isSelected && <i className="bi bi-check2 me-1"></i>}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
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
            <p className="mb-0">나무위키에서 검색 중...</p>
          </div>
        )}
        
        {/* ── 결과 없음 ── */}
        {!loading && searched && keyword && items.length === 0 && (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">검색 결과가 없습니다.</p>
          </div>
        )}


        {/* ── 갤러리 결과 (검색어가 있을 때) ── */}
        {!loading && keyword && items.length > 0 && (
          <div className="row g-3">

            {items.map((item, idx) => (
              <div key={idx} className="col-sm-6 col-lg-4 col-xl-3 col-6">
                <div
                  className="card hover-scale overflow-hidden"
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                >
                  {/* 콘텐츠 이미지 */}
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{ position: 'relative', paddingTop: '100%' }}
                  >
                  </div>

                  <div className="card-body p-3">
                    <h5 className="mt-1 mb-0 text-reset" style={{ fontSize: '1rem' }}>{item.title}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 검색어가 없을 때: 분기별 탭 ── */}
        {!loading && !keyword && (
          <>
            {getOrderedSeasons().map((season) => (
              <div key={season.id} className='season_tab border-bottom mb-5' id={season.id}>
                <h3>{season.label}</h3>
              </div>
            ))}
          </>
        )}

      </div>
    </Layout>
  );
}
