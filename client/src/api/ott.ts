import { clientApi } from '@api/api';

export const getOttList = async (q?: string, quarter?: string) => {
	try {
		const { data } = await clientApi.get('/ott/list', { params: { q, quarter } });
		return data;
	} catch (err: any) {
		alert(err?.message);
		return [];
	}
};

export const getOttDetail = async (id: number) => {
	const { data } = await clientApi.get(`/ott/detail/${id}`);
	return data;
};

export const createOtt = async (dto: any) => {
	const { data } = await clientApi.post('/ott/create', dto);
	return data;
};

export const updateOtt = async (id: number, dto: any) => {
	const { data } = await clientApi.put(`/ott/update/${id}`, dto);
	return data;
};

export const deleteOtt = async (id: number) => {
	const { data } = await clientApi.delete(`/ott/delete/${id}`);
	return data;
};
