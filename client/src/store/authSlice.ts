import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientApi } from '@api/api';
import { AuthInfo } from '@/auth';

interface AuthState {
  user: AuthInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,  // 앱 시작 시 세션 확인 완료 전까지 true 유지
  error: null,
};

// 세션 확인 (새로고침 시 호출)
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await clientApi.get<AuthInfo>('/auth/me');
      return data;
    } catch {
      return rejectWithValue(null);
    }
  },
);

// 로그인
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await clientApi.post<AuthInfo>('/auth/login', credentials);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message;
      return rejectWithValue(Array.isArray(msg) ? msg.join(', ') : msg || '로그인에 실패했습니다.');
    }
  },
);

// 로그아웃
export const logout = createAsyncThunk('auth/logout', async () => {
  await clientApi.post('/auth/logout');
});

// 회원탈퇴
export const withdraw = createAsyncThunk('auth/withdraw', async () => {
  await clientApi.delete('/auth/me');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
    },
    // /login, /signin 진입 시 세션 확인 없이 로딩 종료
    sessionReady(state) {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    // checkSession
    builder
      .addCase(checkSession.pending, (state) => { state.loading = true; })
      .addCase(checkSession.fulfilled, (state, action: PayloadAction<AuthInfo>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(checkSession.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });

    // login
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthInfo>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // logout
    builder
      .addCase(logout.fulfilled, (state) => { state.user = null; })
      .addCase(withdraw.fulfilled, (state) => { state.user = null; });
  },
});

export const { clearError, clearUser, sessionReady } = authSlice.actions;
export default authSlice.reducer;
