import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Frontend tests only. The backend has its own suite: `cd backend && npm test`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
