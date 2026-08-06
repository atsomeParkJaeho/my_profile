import Layout from "@/componet/default/Layout";
import { useLocation, useParams } from "react-router-dom";
import ListPageLayout    from "@/componet/community/ListPageLayout";
import BannerListLayout  from "@/componet/community/BannerListLayout";
import GalleryListLayout from "@/componet/community/GalleryListLayout";
import WritePageLayout   from "@/componet/community/WritePageLayout";
import DetailPageLayout  from "@/componet/community/DetailPageLayout";
import { useAppSelector } from "@store/hooks";
import { LeftMenuList } from "@/util/routeUtil";

const BoardPage = () => {
	const location             = useLocation();
	const { type = 'default' } = useParams<{ type: string }>();
	const { user }             = useAppSelector((state) => state.auth);

	const segments = location.pathname.split('/').filter(Boolean);
	const layout   = segments[0]; // URL 1차 세그먼트 (community | banner | gallery)
	const path     = location.pathname;
	const isList   = path.endsWith('/list');
	const isWrite  = path.endsWith('/write');
	const isDetail = path.endsWith('/detail');

	// LeftMenuList에서 현재 경로에 맞는 항목을 찾아 renderType 결정
	// activePrefix가 없는 항목(home 등)은 제외, fallback은 URL 1차 세그먼트
	const menuItem   = LeftMenuList.find(
		(item) => item.activePrefix && path.startsWith(item.activePrefix),
	);
	const renderType = menuItem?.renderType ?? layout;

	const renderList = () => {
		if (renderType === 'banner')  return <BannerListLayout  id={user} layout={layout} type={type} />;
		if (renderType === 'gallery') return <GalleryListLayout id={user} layout={layout} type={type} />;
		return <ListPageLayout id={user} layout={layout} type={type} />;
	};

	return (
		<Layout>
			{isList   && renderList()}
			{isWrite  && <WritePageLayout  id={user} layout={layout} type={type} actType={location.state?.actType} itemId={location.state?.id} />}
			{isDetail && <DetailPageLayout id={user} layout={layout} type={type} />}
		</Layout>
	);
};

export default BoardPage;
