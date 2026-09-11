import { describe, it, expect } from 'vitest'
import { API_BASE_URL } from './api'

describe('API_BASE_URL', () => {
  it('falls back to the local backend when VITE_API_BASE_URL is not set', () => {
    // vitest does not load a .env, so the fallback is what we get here.
    expect(API_BASE_URL).toBe('http://localhost:3001')
  })

  it('has no trailing slash, so paths can be appended directly', () => {
    expect(API_BASE_URL.endsWith('/')).toBe(false)
  })
})
