import '@testing-library/jest-dom'

// Polyfill for Web APIs (Request/Response/Headers) used in Next.js API routes
if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class Headers {
    private headers: Map<string, string>

    constructor(init?: any) {
      this.headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value as string)
        })
      }
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase())
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value)
    }
  }
}

if (typeof global.Request === 'undefined') {
  (global as any).Request = class Request {
    url: string
    method: string
    headers: any

    constructor(url: string, init?: any) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new (global as any).Headers(init?.headers)
    }
  }
}

if (typeof global.Response === 'undefined') {
  (global as any).Response = class Response {
    body: any
    status: number
    statusText: string
    headers: any
    ok: boolean

    constructor(body?: any, init?: any) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new (global as any).Headers(init?.headers)
      this.ok = this.status >= 200 && this.status < 300
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }

    async text() {
      if (typeof this.body === 'string') {
        return this.body
      }
      return JSON.stringify(this.body)
    }
  }
}

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-auth-domain'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.GEMINI_API_KEY = 'test-gemini-key'

// Mock Next.js server (NextResponse)
jest.mock('next/server', () => {
  const actualResponse = (global as any).Response
  return {
    NextResponse: {
      json: (data: any, init?: any) => {
        const response = new actualResponse(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
          },
        })
        return response
      },
      redirect: (url: string, status?: number) => {
        return new actualResponse(null, {
          status: status || 302,
          headers: { Location: url },
        })
      },
    },
  }
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Firebase
jest.mock('./lib/firebase/client', () => ({
  auth: {
    currentUser: null,
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
  storage: {},
}))

jest.mock('./lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
  adminDb: {},
}))

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
