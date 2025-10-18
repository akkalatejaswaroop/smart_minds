import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// fix: Import fileURLToPath to construct a __dirname equivalent in an ES module context.
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // fix: Replace __dirname, which is not available in ES modules, with a dynamic path resolved from import.meta.url.
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});