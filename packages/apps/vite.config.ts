import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      'game-alchemy-core': '/core/src/index.ts',
      'gl-matrix': '/core/src/vendor/gl-matrix.ts',
    },
  },
  server: {
    port: 3000,
  },
});
