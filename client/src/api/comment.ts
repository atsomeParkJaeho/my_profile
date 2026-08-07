import { clientApi } from '@api/api';

export const getComments = async (postId: number) => {
	const { data } = await clientApi.get(`/comment/${postId}`);
	return data;
};

export const createComment = async (dto: { postId: number; name: string; password: string; content: string }) => {
	const { data } = await clientApi.post('/comment', dto);
	return data;
};

export const deleteComment = async (id: number, password: string) => {
	await clientApi.delete(`/comment/${id}`, { data: { password } });
};
