import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'jutoku';
const SITE_URL  = 'https://my-profile-zc6t.onrender.com';
const DEFAULT_DESCRIPTION = '국내외 상품 최저가 비교와 분기별 애니메이션 OTT 스트리밍 정보를 한 곳에서 확인하세요.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

// 페이지별 title/description/OG 태그를 설정하는 공통 컴포넌트
export default function Seo({ title, description = DEFAULT_DESCRIPTION, path = '', image = DEFAULT_IMAGE, noindex = false }: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
