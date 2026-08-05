import { clientApi } from '@api/api';

export const getInfo = async () => {
  const { data } = await clientApi.get('/profile/info');
  return data;
};

export const updateInfo = async (dto: any) => {
  const { data } = await clientApi.put('/profile/info', dto);
  return data;
};

export const getCareers = async () => {
  const { data } = await clientApi.get('/profile/careers');
  return data;
};

export const createCareer = async (dto: any) => {
  const { data } = await clientApi.post('/profile/careers', dto);
  return data;
};

export const updateCareer = async (id: number, dto: any) => {
  const { data } = await clientApi.put(`/profile/careers/${id}`, dto);
  return data;
};

export const deleteCareer = async (id: number) => {
  const { data } = await clientApi.delete(`/profile/careers/${id}`);
  return data;
};
