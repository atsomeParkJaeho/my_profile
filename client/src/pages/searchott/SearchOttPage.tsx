import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import { getOttList } from '@api/ott';
import { useAppSelector } from '@store/hooks';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const QUARTERS = [
  { label: '전체' },
  { label: '1분기' },
  { label: '2분기' },
  { label: '3분기' },
  { label: '4분기' },
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

const PLATFORM_LINKS = [
  { key: 'netflixLink',      label: '넷플릭스' },
  { key: 'laftelLink',       label: '라프텔' },
  { key: 'wavveLink',        label: '웨이브' },
  { key: 'watchaLink',       label: '왓챠' },
  { key: 'tvingLink',        label: '티빙' },
  { key: 'coupangplayLink',  label: '쿠팡플레이' },
];

export default function SearchOttPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === ADMIN_EMAIL;

  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal,  setInputVal]  = useState(searchParams.get('q') ?? '');
  const [keyword,   setKeyword]   = useState('');
  const [items,     setItems]     = useState<any[]>([]);
  const [allItems,  setAllItems]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<typeof QUARTERS[number] | null>(
    QUARTERS.find((q) => q.label === '전체') ?? null
  );

  const fetchSearch = async (q: string, quarter?: string) => {
    setKeyword(q);
    setLoading(true);
    setSearched(false);
    try {
      const data = await getOttList(q, quarter && quarter !== '전체' ? quarter : undefined);
      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getOttList();
      setAllItems(data ?? []);
    } catch (err) {
      console.error(err);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 시 URL의 q 파라미터로 자동 검색, 없으면 전체 목록 로드
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      fetchSearch(q, searchParams.get('quarter') ?? undefined);
    } else {
      fetchAll();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    const params: Record<string, string> = { q };
    if (selectedQuarter && selectedQuarter.label !== '전체') params.quarter = selectedQuarter.label;
    setSearchParams(params);
    await fetchSearch(q, selectedQuarter?.label);
  };

  const handleReset = () => {
    setInputVal('');
    setKeyword('');
    setItems([]);
    setSearched(false);
    setSelectedQuarter(QUARTERS.find((q) => q.label === '전체') ?? null);
    setSearchParams({});
    fetchAll();
  };

  const handleCardClick = (item: any) => {
    if (isAdmin) {
      navigate('/searchott/write', { state: { actType: 'edit', id: item.id } });
      return;
    }
    const firstLink = PLATFORM_LINKS.map((p) => item[p.key]).find((link) => !!link);
    if (firstLink) window.open(firstLink, '_blank', 'noopener,noreferrer');
  };

  const renderCard = (item: any) => (
    <div key={item.id} className="col-sm-6 col-lg-4 col-xl-3 col-6">
      <div
        className="card hover-scale overflow-hidden"
        style={{ cursor: 'pointer' }}
        onClick={() => handleCardClick(item)}
      >
        {/* 콘텐츠 이미지 */}
        <div
          className="d-flex align-items-center justify-content-center bg-light"
          style={{ position: 'relative', paddingTop: '100%' }}
        >
          {item.image ? (
            <img
              className="card-img-top"
              src={item.image}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', left: 0, top: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : null}
        </div>

        <div className="card-body p-3">
          <h5
            className="mt-1 mb-0 text-reset"
            style={{
              fontSize: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </h5>
          <p className="text-muted small mt-1 mb-0">
            {item.year} {item.quarter}
          </p>
        </div>
      </div>
    </div>
  );

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
                onClick={() => navigate('/searchott/write', { state: { actType: 'create' } })}
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

          {/* 방영분기 카테고리 버튼 */}
          {/* <div className="mt-3">
            <p className="text-muted small mb-2">방영분기 선택 후 검색버튼을 클릭하세요.</p>
            <div className="d-flex flex-wrap gap-2">
              {QUARTERS.map((q) => {
                const isSelected = selectedQuarter?.label === q.label;
                return (
                  <button
                    key={q.label}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                    disabled={loading}
                    onClick={() => setSelectedQuarter(q)}
                  >
                    {isSelected && <i className="bi bi-check2 me-1"></i>}
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div> */}
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
        {!loading && searched && keyword && items.length === 0 && (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">검색 결과가 없습니다.</p>
          </div>
        )}


        {/* ── 갤러리 결과 (검색어가 있을 때) ── */}
        {!loading && keyword && items.length > 0 && (
          <div className="row g-3">
            {items.map((item) => renderCard(item))}
          </div>
        )}

        {/* ── 검색어가 없을 때: 분기별로 전체 목록 ── */}
        {!loading && !keyword && (
          <>
            {getOrderedSeasons().map((season) => {
              const quarterLabel = season.label.replace(/^\d{4}년\s*/, ''); // "2026년 4분기" → "4분기"
              const seasonItems = allItems.filter((item) => item.quarter === quarterLabel);
              return (
                <div key={season.id} className='season_tab border-bottom mb-5' id={season.id}>
                  <h3>{season.label}</h3>
                  {seasonItems.length > 0 ? (
                    <div className="row g-3 mb-4">
                      {seasonItems.map((item) => renderCard(item))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-4">등록된 작품이 없습니다.</p>
                  )}
                </div>
              );
            })}
          </>
        )}

      </div>
    </Layout>
  );
}
