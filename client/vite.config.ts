import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@':            path.resolve(__dirname, 'src'),
      '@api':         path.resolve(__dirname, 'src/api'),
      '@store':       path.resolve(__dirname, 'src/store'),
      '@pages':       path.resolve(__dirname, 'src/pages'),
      '@styles':      path.resolve(__dirname, 'src/styles'),
      '@components':  path.resolve(__dirname, 'src/componet'),
    },
  },
});
