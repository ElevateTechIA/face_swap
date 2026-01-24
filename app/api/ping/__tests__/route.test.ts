import { GET } from '../route'

describe('/api/ping', () => {
  it('should return 200 with ok status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
  })

  it('should include timestamp', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.timestamp).toBeDefined()

    // Check if timestamp is valid ISO 8601 format
    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
  })

  it('should include correct cache headers', async () => {
    const response = await GET()

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toBe('no-cache, no-store, must-revalidate')
  })

  it('should be fast (edge runtime)', async () => {
    const start = Date.now()
    await GET()
    const duration = Date.now() - start

    // Edge function should be very fast (< 100ms)
    expect(duration).toBeLessThan(100)
  })

  it('should have minimal response size', async () => {
    const response = await GET()
    const data = await response.json()

    // Should only have status and timestamp
    expect(Object.keys(data)).toHaveLength(2)
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
  })
})
