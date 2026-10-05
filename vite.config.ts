/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The API has no CORS configuration: the browser only ever talks to this origin,
// and /api is forwarded to the Spring Boot app (nginx does the same in production).
const apiTarget = process.env.API_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses @import and global Sass functions.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
        quietDeps: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
