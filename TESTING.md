# Testing Guide

This project has comprehensive testing coverage including unit tests, integration tests, and end-to-end (E2E) tests.

## Test Stack

- **Unit & Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest coverage reports
- **CI/CD**: GitHub Actions

## Quick Start

```bash
# Install all dependencies
npm install

# Install Playwright browsers (first time only)
npm run playwright:install

# Run all tests
npm run test:all
```

## Running Tests

### Unit & Integration Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI mode)
npm run test:ci

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser UI visible
npm run test:e2e:headed

# Run E2E tests in debug mode (step-through)
npm run test:e2e:debug
```

### All Tests

```bash
# Run all tests (unit + integration + E2E)
npm run test:all
```

## Test Structure

```
project/
├── __tests__/                     # Global test utilities
├── lib/
│   └── security/
│       └── __tests__/             # Unit tests for security utilities
│           ├── rate-limiter.test.ts
│           └── image-validator.test.ts
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── __tests__/         # API route tests
│   │   │       └── route.test.ts
│   │   └── ping/
│   │       └── __tests__/
│   │           └── route.test.ts
│   └── components/
│       └── __tests__/              # Component tests
│           ├── CreditsDisplay.test.tsx
│           └── LanguageSwitcher.test.tsx
├── e2e/                            # E2E tests
│   ├── home.spec.ts
│   ├── api-health.spec.ts
│   └── language-switching.spec.ts
├── jest.config.ts                  # Jest configuration
├── jest.setup.ts                   # Jest setup & mocks
└── playwright.config.ts            # Playwright configuration
```

## What's Tested

### Security Utilities (lib/security)
- ✅ Rate limiting (checkRateLimit, getClientIp)
- ✅ Image validation (size, dimensions, MIME types, EXIF stripping)
- ✅ Rate limit configurations (FACE_SWAP, GUEST_TRIAL, LOGIN, etc.)

### API Routes (app/api)
- ✅ Health check endpoint (/api/health)
- ✅ Ping endpoint (/api/ping)
- ✅ Response formats and status codes
- ✅ Cache headers

### UI Components (app/components)
- ✅ CreditsDisplay (loading states, navigation, rendering)
- ✅ LanguageSwitcher (dropdown, language switching, routing)

### E2E Tests (e2e)
- ✅ Home page loading and navigation
- ✅ API health checks
- ✅ Language switching functionality
- ✅ Responsive design (mobile viewports)
- ✅ No console errors on load

## Coverage Thresholds

Current coverage requirements (defined in jest.config.ts):
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

To view coverage report:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Writing New Tests

### Unit Test Example

```typescript
// lib/utils/__tests__/myUtil.test.ts
import { myFunction } from '../myUtil'

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

### Component Test Example

```typescript
// app/components/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('h1')).toContainText('Title')
})
```

## CI/CD Integration

Tests run automatically on:
- Push to main, develop, or AI-* branches
- Pull requests to main or develop

GitHub Actions workflow: `.github/workflows/test.yml`

Jobs:
1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Jest tests with coverage
4. **E2E Tests** - Playwright tests
5. **Build** - Next.js build verification

## Debugging Tests

### Jest (Unit Tests)

```bash
# Run single test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Update snapshots
npm test -- -u
```

### Playwright (E2E Tests)

```bash
# Run specific test file
npx playwright test e2e/home.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# Generate test code (codegen)
npx playwright codegen http://localhost:3000
```

## Mocking

### Next.js Router
Already mocked in `jest.setup.ts`:
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

### Firebase
Already mocked in `jest.setup.ts`:
```typescript
jest.mock('./lib/firebase/client', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}))
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
   - Good: `should redirect to /credits when button is clicked`
   - Bad: `test 1`

2. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = 'test'

     // Act
     const result = myFunction(input)

     // Assert
     expect(result).toBe('expected')
   })
   ```

3. **Test One Thing**: Each test should verify one behavior

4. **Mock External Dependencies**: Don't make real API calls or database queries in tests

5. **Clean Up**: Reset mocks between tests
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test('...', async () => { ... }, 10000)`
- Or in playwright.config.ts: `timeout: 30000`

### Import errors
- Check `moduleNameMapper` in jest.config.ts
- Ensure path aliases are correctly configured

### Playwright browser not found
- Run: `npm run playwright:install`

### Tests pass locally but fail in CI
- Check environment variables
- Ensure all dependencies are in package.json
- Review CI logs in GitHub Actions

## Coverage Reports

After running `npm run test:coverage`, view reports at:
- Terminal: Summary table
- HTML: `coverage/lcov-report/index.html`
- JSON: `coverage/coverage-final.json`

## Next Steps

To improve test coverage:

1. Add tests for remaining API routes
2. Add tests for complex components (PromptStudio, TemplateForm)
3. Add tests for authentication flows
4. Add tests for payment/Stripe integration
5. Add visual regression testing
6. Add performance testing
7. Add accessibility testing (axe-core)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)
