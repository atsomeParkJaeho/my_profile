import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import Seo from '@/componet/default/Seo';
import { getOttList, incrementOttView } from '@api/ott';
import { useAppSelector } from '@store/hooks';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

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

const OTT_BADGES = [
  { key: 'netflixLink',     text: 'NETFLIX',     color: '#e50914' },
  { key: 'laftelLink',      text: 'LAFTEL',       color: '#816bff' },
  { key: 'tvingLink',       text: 'TVING',        color: '#e5252a' },
  { key: 'wavveLink',       text: 'Wavve',        color: '#2a6ff0' },
  { key: 'watchaLink',      text: 'WATCHA',       color: '#ff0558' },
  { key: 'disneyplusLink',  text: 'Disney+',      color: '#113ccf' },
  { key: 'coupangplayLink', text: 'COUPANG PLAY', color: '#2874f0' },
];

export default function OttGenreSearchPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === ADMIN_EMAIL;

  const parseListParam = (name: string) =>
    (searchParams.get(name) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal,  setInputVal]  = useState(searchParams.get('q') ?? '');
  const [allItems,  setAllItems]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  // 다중 선택: 빈 배열 = "전체"
  const [selectedGenres, setSelectedGenres] = useState<string[]>(parseListParam('genre'));

  const keyword = inputVal.trim();

  // ott_anime 테이블의 genre 컬럼(콤마 구분 문자열)에서 중복 제거한 전체 장르 목록 추출
  const GENRES = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      (item.genre ?? '')
        .split(',')
        .map((g: string) => g.trim())
        .filter(Boolean)
        .forEach((g: string) => set.add(g));
    });
    return ['전체', ...Array.from(set).sort()];
  }, [allItems]);

  // 배열에 값이 있으면 제거, 없으면 추가 (다중 선택 토글)
  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

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

  // 전체 목록을 한 번만 불러온 뒤, 검색/장르 필터는 allItems에서 실시간으로 계산
  useEffect(() => {
    fetchAll();
  }, []);

  const isGenreFiltered = selectedGenres.length > 0;
  const searched = !!keyword || isGenreFiltered;

  const items = useMemo(() => {
    if (!searched) return [];
    return allItems.filter((item) => {
      const matchesKeyword =
        !keyword || item.title?.includes(keyword) || item.subTitle?.includes(keyword);
      const itemGenres = (item.genre ?? '').split(',').map((g: string) => g.trim());
      const matchesGenre = !isGenreFiltered || selectedGenres.some((g) => itemGenres.includes(g));
      return matchesKeyword && matchesGenre;
    });
  }, [allItems, keyword, searched, isGenreFiltered, selectedGenres]);

  // 현재 선택 상태(+ 변경분)를 URL 쿼리에 반영 (다중 선택은 콤마로 구분)
  const syncParams = (overrides: {
    genre?: string[];
  } = {}) => {
    const genre = overrides.genre ?? selectedGenres;

    const params: Record<string, string> = {};
    if (keyword) params.q = keyword;
    if (genre.length) params.genre = genre.join(',');
    setSearchParams(params);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    syncParams();
  };

  const handleGenreClick = (g: string) => {
    if (g === '전체') {
      setSelectedGenres([]);
      syncParams({ genre: [] });
      return;
    }
    const next = toggleInArray(selectedGenres, g);
    setSelectedGenres(next);
    syncParams({ genre: next });
  };

  const handleReset = () => {
    setInputVal('');
    setSelectedGenres([]);
    setSearchParams({});
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
        {/* 콘텐츠 이미지 (클릭 시 상세보기로 이동, 회원/비회원 공통) */}
        <div
          className="d-flex align-items-center justify-content-center bg-light"
          style={{ position: 'relative', paddingTop: '130%' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/searchott/detail', { state: { id: item.id } });
          }}
        >
          {item.image ? (
            <img
              className="card-img-top"
              src={item.image}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition:'center', position: 'absolute', left: 0, top: 0 }}
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
          <div className='ott_link_group mt-2 d-flex flex-column gap-1'>
            {OTT_BADGES.filter((b) => item?.[b.key]).map((b) => (
              <a
                key={b.key}
                href={item[b.key]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.stopPropagation(); incrementOttView(item.id); }}
                className="d-flex align-items-center gap-1 text-decoration-none"
                style={{ fontSize: '0.8rem' }}
              >
                <span style={{ color: b.color, fontWeight: 700 }}>{b.text}</span>
                <i className="bi bi-play-circle-fill text-success" style={{ fontSize: '0.8rem' }}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <Seo
        title="장르별 OTT 검색"
        description="2026년 분기별 일본 애니메이션을 장르별로 검색하고 넷플릭스, 티빙, 웨이브, 왓챠, 라프텔, 쿠팡플레이, 디즈니플러스 스트리밍 정보를 확인하세요."
        path="/searchott/genre"
      />
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

          {/* 장르별 검색 */}
          <div className="mt-3">
            <p className="text-muted small mb-2">장르별 검색</p>
            <div className={`genre-filter-group d-flex flex-wrap gap-2 ${genreOpen ? 'genre-filter-group--open' : ''}`}>
              {GENRES.map((g) => {
                const isSelected = g === '전체' ? selectedGenres.length === 0 : selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                    disabled={loading}
                    onClick={() => handleGenreClick(g)}
                  >
                    {isSelected && <i className="bi bi-check2 me-1"></i>}
                    {g}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-link btn-sm px-0 mt-1 text-decoration-none"
              onClick={() => setGenreOpen((prev) => !prev)}
            >
              {genreOpen ? '접기' : '더보기'}
              <i className={`bi ${genreOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
            </button>
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
            <p className="mb-0">OTT 정보를 불러오는 중...</p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {!loading && searched && items.length === 0 && (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">검색 결과가 없습니다.</p>
          </div>
        )}


        {/* ── 갤러리 결과 (검색/필터 조건이 있을 때) ── */}
        {!loading && searched && items.length > 0 && (
          <div className="row g-3">
            {items.map((item) => renderCard(item))}
          </div>
        )}

        {/* ── 검색/필터 조건이 없을 때: 분기별로 전체 목록 ── */}
        {!loading && !searched && (
          <>
            {getOrderedSeasons().map((season) => {
              const quarterLabel = season.label.replace(/^\d{4}년\s*/, ''); // "2026년 4분기" → "4분기"
              const seasonItems = allItems.filter((item) => item.quarter === quarterLabel);
              return (
                <div key={season.id} className='season_tab' id={season.id}>
                  <h3 className='border-bottom pb-3 mb-3'>{season.label}</h3>
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
