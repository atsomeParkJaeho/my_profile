import { configureStore } from '@reduxjs/toolkit';
import authReducer  from './authSlice';
import usersReducer from './usersSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    auth:  authReducer,
    users: usersReducer,
    theme: themeReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
