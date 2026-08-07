import { clientApi } from '@api/api';

export const sendContact = async (dto: { name: string; email: string; phone?: string; message: string }) => {
	const { data } = await clientApi.post('/contact/send', dto);
	return data;
};
