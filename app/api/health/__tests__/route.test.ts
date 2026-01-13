import { GET } from '../route'

describe('/api/health', () => {
  it('should return 200 with healthy status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.timestamp).toBeDefined()
    expect(data.uptime).toBeGreaterThanOrEqual(0)
    expect(data.environment).toBeDefined()
    expect(data.nodejs).toBeDefined()
  })

  it('should include correct cache headers', async () => {
    const response = await GET()

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toBe('no-cache, no-store, must-revalidate')
  })

  it('should return ISO timestamp', async () => {
    const response = await GET()
    const data = await response.json()

    // Check if timestamp is valid ISO 8601 format
    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
  })

  it('should include process uptime', async () => {
    const response = await GET()
    const data = await response.json()

    expect(typeof data.uptime).toBe('number')
    expect(data.uptime).toBeGreaterThanOrEqual(0)
  })

  it('should include Node.js version', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.nodejs).toMatch(/^v\d+\.\d+\.\d+/)
  })

  it('should include environment', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.environment).toBeDefined()
    expect(['test', 'development', 'production', 'unknown']).toContain(data.environment)
  })
})
