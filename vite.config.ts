import { defineConfig } from 'vite';

export default defineConfig({
  build: { target: 'es2022', cssCodeSplit: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
