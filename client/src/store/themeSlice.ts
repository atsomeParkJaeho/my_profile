import { createSlice } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

// localStorage에서 초기값 로드 (없으면 시스템 설정 따름)
function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: initialTheme as Theme },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      applyTheme(state.mode);
    },
    setTheme(state, action: { payload: Theme }) {
      state.mode = action.payload;
      applyTheme(state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
