import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/componet/default/Layout';

interface OttAvailability {
  name: string;
  subtitle: boolean;
  dubbing: boolean;
}

interface OttItem {
  title: string;
  img: string;
  platform: string;
  price: number;
  rating: number;
  html: string;
  ottList: OttAvailability[];
}

const OTT_COLORS: Record<string, string> = {
  넷플릭스: '#ef1f1c',
  라프텔:   '#816bff',
  티빙:     '#ff143d',
  웨이브:   '#0050ff',
  왓챠:     '#ff0558',
};

const OTT_LABELS: Record<string, string> = {
  넷플릭스: 'NETFLIX',
  라프텔:   'LAFTEL',
  티빙:     'TVING',
  웨이브:   'Wavve',
  왓챠:     'WATCHA',
};

const CATEGORIES = [
  { label: '넷플릭스', url: 'https://www.netflix.com' },
  { label: '티빙',     url: 'https://www.tving.com' },
  { label: '웨이브',   url: 'https://www.wavve.com' },
  { label: '쿠팡플레이', url: 'https://www.coupangplay.com' },
];

// TODO: 전용 API 연동 전까지 사용하는 목업 데이터
const MOCK_ITEMS: OttItem[] = [
  {
    title: '더 글로리', img: '', platform: '넷플릭스', price: 13500, rating: 4.5, html: '',
    ottList: [
      { name: '넷플릭스', subtitle: true, dubbing: true },
      { name: '티빙',     subtitle: true, dubbing: false },
    ],
  },
  {
    title: '오징어 게임', img: '', platform: '넷플릭스', price: 13500, rating: 4.8, html: '',
    ottList: [
      { name: '넷플릭스', subtitle: true, dubbing: true },
      { name: '웨이브',   subtitle: true, dubbing: false },
    ],
  },
  {
    title: '이번 생도 잘 부탁해', img: '', platform: '티빙', price: 9900, rating: 4.2, html: '',
    ottList: [
      { name: '티빙', subtitle: true, dubbing: false },
      { name: '왓챠', subtitle: true, dubbing: true },
    ],
  },
  {
    title: '눈물의 여왕', img: '', platform: '웨이브', price: 10900, rating: 4.6, html: '',
    ottList: [
      { name: '웨이브', subtitle: true, dubbing: false },
      { name: '왓챠',   subtitle: true, dubbing: true },
    ],
  },
  {
    title: '스위트홈', img: '', platform: '넷플릭스', price: 13500, rating: 4.0, html: '',
    ottList: [
      { name: '넷플릭스', subtitle: true, dubbing: true },
    ],
  },
  {
    title: '무빙', img: '', platform: '쿠팡플레이', price: 7900, rating: 4.7, html: '',
    ottList: [
      { name: '라프텔', subtitle: true, dubbing: true },
      { name: '티빙',   subtitle: true, dubbing: false },
      { name: '웨이브', subtitle: true, dubbing: false },
      { name: '왓챠',   subtitle: true, dubbing: true },
    ],
  },
];

export default function SearchOttPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal,        setInputVal]        = useState(searchParams.get('q') ?? '');
  const [keyword,         setKeyword]         = useState('');
  const [items,           setItems]           = useState<OttItem[]>(MOCK_ITEMS);
  const [loading,         setLoading]         = useState(false);
  const [searched,        setSearched]        = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number] | null>(
    CATEGORIES.find((cat) => cat.label === '넷플릭스') ?? null
  );

  const fetchSearch = async (q: string, category?: string) => {
    setKeyword(q);
    setLoading(true);
    setSearched(false);
    try {
      // TODO: 전용 API 연동 예정 - 현재는 목업 데이터로 필터링만 수행
      await new Promise((resolve) => setTimeout(resolve, 300));
      const filtered = MOCK_ITEMS.filter((item) => {
        const matchTitle = item.title.includes(q);
        const matchCategory = category ? item.platform === category : true;
        return matchTitle && matchCategory;
      });
      setItems(filtered);
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
    if (selectedCategory) params.category = selectedCategory.label;
    setSearchParams(params);
    await fetchSearch(q, selectedCategory?.label);
  };

  const handleReset = () => {
    setInputVal('');
    setKeyword('');
    setItems(MOCK_ITEMS);
    setSearched(true);
    setSelectedCategory(CATEGORIES.find((cat) => cat.label === '넷플릭스') ?? null);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="my-4">

        {/* ── 검색 헤더 ── */}
        <div className="mb-4">
          <h5 className="fw-bold mb-1">
            <i className="bi bi-tv me-2 text-primary"></i>OTT 정보
          </h5>
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
            <p className="mb-0">OTT 정보를 검색 중...</p>
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
              <div key={idx} className="col-sm-6 col-lg-4 col-xl-3">
                <div className="card hover-scale overflow-hidden">
                  {/* 콘텐츠 이미지 */}
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{ position: 'relative', paddingTop: '100%' }}
                  >
                    {item.img ? (
                      <img
                        className="card-img-top"
                        src={item.img}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', left: 0, top: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                  </div>

                  <div className="card-body p-3">
                    <div className="nav">
                      {/* <span className="small fw-600 me-2 text-primary">{item.platform}</span> */}
                    </div>
                    <h5 className="mt-1 mb-0 text-reset" style={{ fontSize: '1rem' }}>{item.title}</h5>
                    <div className="mt-2 d-flex flex-column gap-1">
                      {item.ottList.map((ott) => (
                        <div
                          key={ott.name}
                          className="small fw-600 d-flex align-items-center flex-wrap"
                          style={{ color: OTT_COLORS[ott.name] ?? '#6c757d' }}
                        >
                          <span>{OTT_LABELS[ott.name] ?? ott.name}</span>
                        </div>
                      ))}
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
