import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchUsers } from '@api/api';

interface UsersState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  loading: false,
  error: null,
};

// auth_user 목록 조회
export const loadUsers = createAsyncThunk(
  'users/loadUsers',
  async (_, { rejectWithValue }) => {
    const res = await fetchUsers();
    if (res === 'logout' || res === 'ng') {
      return rejectWithValue(res);
    }
    return res;
  },
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loadUsers.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default usersSlice.reducer;
