/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Output the production build directly into the API's wwwroot folder
    // so ASP.NET Core can serve the SPA as static files.
    outDir: '../src/NoteApp.Api/wwwroot',
    emptyOutDir: true,
  },

  server: {
    // In development, proxy all /api requests to the ASP.NET Core backend.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  test: {
    // Use jsdom so React components can be rendered in tests.
    environment: 'jsdom',
    // Auto-import jest-dom matchers (toBeInTheDocument, etc.) for all test files.
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
