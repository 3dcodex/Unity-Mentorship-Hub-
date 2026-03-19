import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          include: ['pages/**', 'components/**', 'utils/**', 'services/**'],
        },
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('firebase')) return 'firebase';
                if (id.includes('@google')) return 'google-vendor';
                if (id.includes('chart.js') || id.includes('recharts')) return 'charts';
                if (id.includes('react-router')) return 'react-vendor';
                if (id.includes('react-dom')) return 'react-vendor';
                if (id.includes('react')) return 'react-vendor';
              }
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
