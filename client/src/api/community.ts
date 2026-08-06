import { clientApi } from "@api/api";

export const getCommunity = async (layout = 'community', type = 'default') => {
	try {
		const { data } = await clientApi.get(`/community/list/${layout}/${type}`);
		return data;
	} catch (err: any) {
		alert(err?.message);
		return [];
	}
};

export const getCommunityDetail = async (id: number) => {
	const { data } = await clientApi.get(`/community/detail/${id}`);
	return data;
};

export const updateCommunity = async (id: number, dto: any) => {
	const { data } = await clientApi.put(`/community/update/${id}`, dto);
	return data;
};

export const deleteCommunity = async (id: number) => {
	const { data } = await clientApi.delete(`/community/delete/${id}`);
	return data;
};
