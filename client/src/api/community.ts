import {clientApi} from "@api/api";

export const getCommunity = async () => {
	let res:any = 'ng'
	try {
		let {data} = await clientApi.get(`/community/list`);
		res = data;
	} catch (err:any) {
		return alert(`${err?.message}`)
	}

	return res;
}

export const getCommunityDetail = async (id: number) => {
	const { data } = await clientApi.get(`/community/detail/${id}`);
	return data;
}

export const updateCommunity = async (id: number, dto: any) => {
	const { data } = await clientApi.put(`/community/update/${id}`, dto);
	return data;
}

export const deleteCommunity = async (id: number) => {
	const { data } = await clientApi.delete(`/community/delete/${id}`);
	return data;
}