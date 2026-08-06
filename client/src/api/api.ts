import axios from 'axios';

export const clientApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const updateProfileImage = async (profileImage: string) => {
  const { data } = await clientApi.patch('/profile/profile-image', { profileImage });
  return data;
};
