import Layout from "@/componet/default/Layout";
import { useLocation, useParams } from "react-router-dom";
import ListPageLayout from "@/componet/community/ListPageLayout";
import WritePageLayout from "@/componet/community/WritePageLayout";
import DetailPageLayout from "@/componet/community/DetailPageLayout";
import { useAppSelector } from "@store/hooks";

const CommunityPage = () => {
	const location             = useLocation();
	const { type = 'default' } = useParams<{ type: string }>();
	const { user }             = useAppSelector((state) => state.auth);

	const path     = location.pathname;
	const isList   = path.endsWith('/list');
	const isWrite  = path.endsWith('/write');
	const isDetail = path.endsWith('/detail');

	return (
		<Layout>
			{isList   && <ListPageLayout   id={user} type={type} />}
			{isWrite  && <WritePageLayout  id={user} type={type} actType={location.state?.actType} itemId={location.state?.id} />}
			{isDetail && <DetailPageLayout id={user} type={type} />}
		</Layout>
	);
};

export default CommunityPage;
