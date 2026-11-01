import { defineConfig } from 'vite';

// GitHub Pages 하위 경로에서도 동작하도록 상대 경로 사용
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
});
