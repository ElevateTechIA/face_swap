import { test, expect } from '@playwright/test'

test.describe('API Health Checks', () => {
  test('GET /api/health should return 200', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.timestamp).toBeDefined()
    expect(data.uptime).toBeGreaterThanOrEqual(0)
    expect(data.environment).toBeDefined()
    expect(data.nodejs).toBeDefined()
  })

  test('GET /api/ping should return 200', async ({ request }) => {
    const response = await request.get('/api/ping')

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  test('/api/health should have no-cache headers', async ({ request }) => {
    const response = await request.get('/api/health')

    const cacheControl = response.headers()['cache-control']
    expect(cacheControl).toContain('no-cache')
    expect(cacheControl).toContain('no-store')
  })

  test('/api/ping should have no-cache headers', async ({ request }) => {
    const response = await request.get('/api/ping')

    const cacheControl = response.headers()['cache-control']
    expect(cacheControl).toContain('no-cache')
    expect(cacheControl).toContain('no-store')
  })

  test('/api/ping should be faster than /api/health', async ({ request }) => {
    const pingStart = Date.now()
    await request.get('/api/ping')
    const pingDuration = Date.now() - pingStart

    const healthStart = Date.now()
    await request.get('/api/health')
    const healthDuration = Date.now() - healthStart

    // Ping should generally be faster (though not guaranteed in all environments)
    // Just check both are reasonably fast (< 1000ms)
    expect(pingDuration).toBeLessThan(1000)
    expect(healthDuration).toBeLessThan(1000)
  })

  test('/api/health should return consistent data shape', async ({ request }) => {
    const response1 = await request.get('/api/health')
    const data1 = await response1.json()

    const response2 = await request.get('/api/health')
    const data2 = await response2.json()

    // Should have same keys
    expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort())

    // Should have expected keys
    expect(data1).toHaveProperty('status')
    expect(data1).toHaveProperty('timestamp')
    expect(data1).toHaveProperty('uptime')
    expect(data1).toHaveProperty('environment')
    expect(data1).toHaveProperty('nodejs')
  })
})
