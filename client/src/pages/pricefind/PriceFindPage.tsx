import { useState } from 'react';
import Layout from '@/componet/default/Layout';
import axios from "axios";

const SAMPLE_ITEMS = [
  { id: 1, category: '전자기기', tag: '노트북', title: 'MacBook Pro 14인치 M3', desc: '애플 실리콘 M3 칩, 18GB RAM, 512GB SSD. 성능과 배터리 모두 최상위권.', price: '2,390,000', store: '애플 공식', date: '2026.08.10', img: '' },
  { id: 2, category: '전자기기', tag: '스마트폰', title: 'Samsung Galaxy S25 Ultra', desc: '6.8인치 QHD+, 200MP 카메라, S펜 내장. 생산성 최강 안드로이드 플래그십.', price: '1,699,000', store: '삼성닷컴', date: '2026.08.09', img: '' },
  { id: 3, category: '가전', tag: '청소기', title: '다이슨 V15 Detect', desc: '레이저 먼지 감지 기술 탑재. 60분 연속 사용 가능한 무선 청소기.', price: '899,000', store: '다이슨 공식', date: '2026.08.08', img: '' },
  { id: 4, category: '전자기기', tag: '태블릿', title: 'iPad Pro 11인치 M4', desc: 'OLED 디스플레이 첫 탑재, M4 칩. 얇고 가벼운 프로 태블릿.', price: '1,349,000', store: '애플 공식', date: '2026.08.07', img: '' },
  { id: 5, category: '가전', tag: '에어컨', title: 'LG 휘센 타워에어컨 6평형', desc: '인버터 절전 기술, 공기청정 기능 내장. 설치비 포함 특가.', price: '1,120,000', store: 'LG전자', date: '2026.08.06', img: '' },
  { id: 6, category: '패션', tag: '운동화', title: '나이키 에어맥스 270', desc: '에어 유닛 최대 높이 탑재 라이프스타일 스니커즈. 다양한 컬러 구성.', price: '179,000', store: '나이키 공식', date: '2026.08.05', img: '' },
];

const CATEGORIES = ['전체', '전자기기', '가전', '패션'];
const TAGS = ['노트북', '스마트폰', '태블릿', '청소기', '에어컨', '운동화'];

const ICON_MAP: Record<string, string> = {
  '전자기기': 'bi-cpu',
  '가전': 'bi-house',
  '패션': 'bi-bag',
};

export default function PriceFindPage() {
  const [keyword,  setKeyword]  = useState('');
  const [inputVal, setInputVal] = useState('');
  const [category, setCategory] = useState('전체');
  const [activeTag, setActiveTag] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputVal.trim();
    setKeyword(q);
    if (!q) return;
    try {
      const { data } = await axios.get(`/api/pricefind/search`, { params: { q } });
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? '' : tag));
  };

  const filtered = SAMPLE_ITEMS.filter((item) => {
    const matchCat = category === '전체' || item.category === category;
    const matchTag = !activeTag || item.tag === activeTag;
    const matchKw  = !keyword  || item.title.includes(keyword) || item.desc.includes(keyword) || item.tag.includes(keyword);
    return matchCat && matchTag && matchKw;
  });

  return (
    <Layout>
      <div className="my-4">

        {/* ── 검색 헤더 ── */}
        <div className="card card-body mb-4">
          <h5 className="fw-bold mb-1"><i className="bi bi-search me-2 text-primary"></i>가격 비교</h5>
          <p className="text-muted small mb-3">원하는 상품을 검색하고 최저가를 확인하세요.</p>
          <form className="d-flex input-group" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control"
              placeholder="상품명, 카테고리, 태그 검색..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button className="btn btn-primary flex-shrink-0" type="submit">
              <i className="bi bi-search me-1"></i>검색
            </button>
          </form>

          {/* 카테고리 탭 */}
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 태그 필터 */}
          <div className="d-flex gap-2 mt-2 flex-wrap">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className={`badge rounded-pill fs-6 px-3 py-2 ${activeTag === tag ? 'bg-primary' : 'bg-secondary bg-opacity-25 text-secondary'}`}
                style={{ cursor: 'pointer', fontSize: '0.78rem !important' }}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── 결과 헤더 ── */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
          <span className="text-muted small">
            {keyword && <><strong className="text-dark">"{keyword}"</strong> 검색 결과 · </>}
            총 <strong>{filtered.length}</strong>건
          </span>
          {(keyword || activeTag || category !== '전체') && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => { setKeyword(''); setInputVal(''); setCategory('전체'); setActiveTag(''); }}
            >
              <i className="bi bi-x-circle me-1"></i>필터 초기화
            </button>
          )}
        </div>

        {/* ── 갤러리 결과 ── */}
        {filtered.length === 0 ? (
          <div className="card card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <p className="mb-0">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((item) => (
              <div key={item.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.13)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}>

                  {/* 이미지 영역 */}
                  <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-top"
                    style={{ height: 140 }}>
                    <i className={`bi ${ICON_MAP[item.category] ?? 'bi-box'} text-primary`} style={{ fontSize: '3rem' }}></i>
                  </div>

                  <div className="card-body p-3">
                    {/* 배지 */}
                    <div className="d-flex gap-1 mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary">{item.category}</span>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary">#{item.tag}</span>
                    </div>

                    <h6 className="fw-bold mb-1" style={{ fontSize: '0.92rem' }}>{item.title}</h6>
                    <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>{item.desc}</p>

                    {/* 가격 + 쇼핑몰 */}
                    <div className="d-flex align-items-center justify-content-between border-top pt-2">
                      <div>
                        <div className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                          ₩{item.price}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.store}</div>
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{item.date}</span>
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
