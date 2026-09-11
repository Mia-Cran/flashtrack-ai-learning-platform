import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount whatever a test rendered so the next one starts with a clean DOM.
afterEach(() => {
  cleanup()
})
