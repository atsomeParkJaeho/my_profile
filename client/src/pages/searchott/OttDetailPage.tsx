import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/componet/default/Layout';
import { getOttDetail } from '@api/ott';
import { useAppSelector } from '@store/hooks';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const OTT_BADGES = [
  { key: 'netflixLink',     text: 'NETFLIX',     color: '#e50914' },
  { key: 'laftelLink',      text: 'LAFTEL',       color: '#816bff' },
  { key: 'tvingLink',       text: 'TVING',        color: '#e5252a' },
  { key: 'wavveLink',       text: 'Wavve',        color: '#2a6ff0' },
  { key: 'watchaLink',      text: 'WATCHA',       color: '#ff0558' },
  { key: 'disneyplusLink',  text: 'Disney+',      color: '#113ccf' },
  { key: 'coupangplayLink', text: 'COUPANG PLAY', color: '#2874f0' },
];

export default function OttDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin  = user?.email === ADMIN_EMAIL;

  const itemId = (location.state as any)?.id;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) { navigate('/searchott'); return; }
    getOttDetail(itemId)
      .then((data) => setItem(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">로딩 중...</div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="text-center py-5 text-muted">작품 정보를 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="card card-body mt-4">
        <div className="row g-4">
          {/* 이미지 */}
          <div className="col-md-4">
            <div
              className="d-flex align-items-center justify-content-center bg-light rounded overflow-hidden"
              style={{ position: 'relative', paddingTop: '140%' }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom', position: 'absolute', left: 0, top: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }} />
              )}
            </div>
          </div>

          {/* 정보 */}
          <div className="col-md-8">
            <h4 className="mb-1">{item.title}</h4>
            {item.subTitle && <p className="text-muted mb-2">{item.subTitle}</p>}

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted mb-3" style={{ fontSize: '0.85rem' }}>
              {item.year && <span><i className="bi bi-calendar3 me-1"></i>{item.year}</span>}
              {item.quarter && <span><i className="bi bi-collection me-1"></i>{item.quarter}</span>}
              {item.weekday && <span><i className="bi bi-clock me-1"></i>{item.weekday}</span>}
            </div>

            {item.genre && (
              <div className="mb-3">
                <span className="text-muted small me-2">장르</span>
                {item.genre.split(',').map((g: string) => g.trim()).filter(Boolean).map((g: string) => (
                  <span key={g} className="badge genre-badge border me-1 mb-1">{g}</span>
                ))}
              </div>
            )}

            <hr />

            {/* 스트리밍 링크 */}
            <div className="ott_link_group d-flex flex-column gap-2">
              {OTT_BADGES.filter((b) => item?.[b.key]).map((b) => (
                <a
                  key={b.key}
                  href={item[b.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center gap-1 text-decoration-none"
                  style={{ fontSize: '0.9rem' }}
                >
                  <span style={{ color: b.color, fontWeight: 700 }}>{b.text}</span>
                  <i className="bi bi-play-circle-fill text-success"></i>
                </a>
              ))}
              {OTT_BADGES.every((b) => !item?.[b.key]) && (
                <span className="text-muted small">등록된 스트리밍 링크가 없습니다.</span>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="border-top pt-4 mt-4 d-flex justify-content-end gap-2">
          {isAdmin && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate('/searchott/write', { state: { id: item.id, actType: 'edit' } })}
            >
              <i className="bi bi-pencil-square me-1"></i>수정
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/searchott')}
          >
            <i className="bi bi-list-ul me-1"></i>목록
          </button>
        </div>
      </article>
    </Layout>
  );
}
