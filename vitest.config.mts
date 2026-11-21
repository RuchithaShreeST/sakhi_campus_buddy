import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(projectRoot, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/components/**/*.test.tsx'],
    restoreMocks: true,
  },
});
