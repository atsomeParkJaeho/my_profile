export interface AuthInfo {
  id: number;
  name: string;
  email: string;
}

// 서버 GET /api/auth/me 로 세션 유효성 확인
export async function fetchMe(clientApi: any): Promise<AuthInfo | null> {
  try {
    const { data } = await clientApi.get<AuthInfo>('/auth/me');
    console.log(data);
    return data;
  } catch {
    return null;
  }
}
