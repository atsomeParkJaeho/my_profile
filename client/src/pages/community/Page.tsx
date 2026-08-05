import Layout from "@/componet/default/Layout";
import {useLocation} from "react-router-dom";
import ListPageLayout from "@/componet/community/ListPageLayout";
import WritePageLayout from "@/componet/community/WritePageLayout";
import DetailPageLayout from "@/componet/community/DetailPageLayout";
import {useAppSelector} from "@store/hooks";

const CommunityPage = () => {
	const loaction:any = useLocation();
	const { user }          = useAppSelector((state) => state.auth);
	const tableName = `community_table`
	return (
		<>
			<Layout>
				{loaction?.pathname === `/community/list` && (
					<ListPageLayout id={user}/>
				)}
				{loaction?.pathname === `/community/write` && (
					<WritePageLayout id={user} actType={loaction?.state?.actType} itemId={loaction?.state?.id}/>
				)}
				{loaction?.pathname === `/community/detail` && (
					<DetailPageLayout id={user}/>
				)}
			</Layout>
		</>
	)
}

export default CommunityPage;