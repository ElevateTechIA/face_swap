# Error Boundaries Implementation Guide

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## Implemented Error Boundaries

### 1. Global Error Boundary (`app/error.tsx`)

**Purpose:** Catches errors at the root level of the application.

**Features:**
- Catches all uncaught errors in the app
- Displays user-friendly error message
- Shows error details in development mode
- Provides "Try Again" and "Go Home" actions
- Logs errors for monitoring (TODO: integrate with Sentry/DataDog)

**When it triggers:**
- Unhandled errors in any component
- Build-time errors
- Server-side rendering errors

### 2. Localized Error Boundary (`app/[locale]/error.tsx`)

**Purpose:** Catches errors within internationalized routes with proper translations.

**Features:**
- All features from global error boundary
- Uses `next-intl` for translations (ES/EN)
- Respects user's language preference
- Consistent with app's i18n strategy

**When it triggers:**
- Errors within `/[locale]` routes
- Takes precedence over global error boundary for these routes

## Translation Keys

Added to `messages/es.json` and `messages/en.json`:

```json
{
  "errorBoundary": {
    "title": "¡Ups! Algo salió mal / Oops! Something went wrong",
    "description": "Error description...",
    "tryAgain": "Intentar de Nuevo / Try Again",
    "goHome": "Ir al Inicio / Go Home",
    "needHelp": "¿Necesitas ayuda? / Need help?",
    "contactSupport": "Contactar Soporte / Contact Support",
    "errorId": "ID del Error / Error ID"
  }
}
```

## Testing Error Boundaries

### Quick Testing with ErrorBoundaryTest Component (Easiest)

The easiest way to test error boundaries is using the `ErrorBoundaryTest` component:

1. **Import the component** in any page:
```tsx
import { ErrorBoundaryTest } from '@/app/components/ErrorBoundaryTest';

export default function Page() {
  return (
    <div>
      <ErrorBoundaryTest /> {/* Only visible in development */}
      {/* Your page content */}
    </div>
  );
}
```

2. **A floating test panel** will appear in the bottom-right corner (development only)

3. **Click the buttons** to test different error scenarios:
   - "Throw Error" - Tests synchronous error
   - "Throw Async Error" - Tests asynchronous error

4. **Remove the import** when done testing

### Manual Testing Methods

In development, you can also test by:

1. **Add a test button to any page:**

Temporarily add this to any page component (e.g., `app/[locale]/page.tsx`):

```tsx
'use client';
// Add at the top of your component
const [shouldThrow, setShouldThrow] = useState(false);

if (shouldThrow) {
  throw new Error('Test error from error boundary');
}

// Add this button in your JSX
<button
  onClick={() => setShouldThrow(true)}
  className="px-4 py-2 bg-red-600 text-white rounded"
>
  Test Error Boundary
</button>
```

2. **Trigger an API error:**

Add this to test async errors:

```tsx
<button
  onClick={async () => {
    const response = await fetch('/api/non-existent-endpoint');
    if (!response.ok) throw new Error('API Error');
  }}
  className="px-4 py-2 bg-orange-600 text-white rounded"
>
  Test API Error
</button>
```

3. **Test by breaking a component:**

Temporarily break a component by accessing undefined:

```tsx
const data = null;
return <div>{data.nonExistent.property}</div>; // Will throw error
```

4. **Use Browser Console:**

Open browser console and execute:
```javascript
throw new Error('Manual error test');
```

## What Happens When an Error Occurs

### Development Mode

1. Error boundary catches the error
2. Error details are displayed on screen (message, stack trace, error ID)
3. Error is logged to browser console
4. User can click "Try Again" to reset the error boundary
5. User can click "Go Home" to navigate to homepage

### Production Mode

1. Error boundary catches the error
2. User-friendly error message is displayed (no technical details)
3. Error is sent to monitoring service (TODO: implement Sentry/DataDog)
4. Same recovery options available

## Integration with Monitoring Services

### TODO: Sentry Integration

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Update `app/error.tsx` and `app/[locale]/error.tsx`:

```tsx
useEffect(() => {
  console.error('Error caught:', error);

  // Send to Sentry
  Sentry.captureException(error, {
    tags: {
      errorBoundary: 'global', // or 'localized'
    },
  });
}, [error]);
```

### TODO: DataDog Integration

```bash
npm install @datadog/browser-rum
```

```tsx
import { datadogRum } from '@datadog/browser-rum';

useEffect(() => {
  datadogRum.addError(error, {
    source: 'error-boundary',
    startTime: Date.now(),
  });
}, [error]);
```

## Error Boundary Hierarchy

```
app/error.tsx (Global)
  └── app/[locale]/error.tsx (Localized)
       └── app/[locale]/[route]/error.tsx (Route-specific, if needed)
```

## Best Practices

### ✅ DO:
- Keep error messages user-friendly
- Log errors for debugging
- Provide clear recovery actions
- Test error boundaries regularly
- Send errors to monitoring service in production
- Show error IDs for support tickets

### ❌ DON'T:
- Show stack traces in production
- Display technical jargon to users
- Hide errors without logging
- Make error boundaries too granular (can add unnecessary complexity)
- Forget to remove test routes in production

## Common Error Scenarios

### 1. API Request Failures
```tsx
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('API request failed');
} catch (error) {
  // Error boundary will catch this
  throw error;
}
```

### 2. Missing Data
```tsx
if (!data) {
  throw new Error('Required data is missing');
}
```

### 3. Invalid Props
```tsx
if (!props.requiredProp) {
  throw new Error('requiredProp is required');
}
```

## Route-Specific Error Boundaries (Optional)

For critical routes that need custom error handling, create route-specific error boundaries:

```tsx
// app/[locale]/credits/error.tsx
export default function CreditsError({ error, reset }) {
  return (
    <div>
      <h1>Payment Error</h1>
      <p>There was an issue with your payment. Please try again.</p>
      <button onClick={reset}>Retry Payment</button>
    </div>
  );
}
```

## Monitoring Metrics

Track these metrics in production:

- **Error Rate:** Errors per 1000 requests
- **Error Types:** Categorize by error message
- **Affected Routes:** Which pages have most errors
- **Recovery Rate:** How often users click "Try Again" vs "Go Home"
- **Time to Recovery:** How long until user recovers from error

## Next Steps

1. ✅ Error boundaries implemented
2. ⏳ Test error boundaries thoroughly
3. ⏳ Integrate with Sentry or DataDog
4. ⏳ Set up error monitoring dashboard
5. ⏳ Create alerts for critical errors
6. ⏳ Remove `/test-error` route before production deploy

## Support

For questions or issues with error boundaries:
- Check Next.js docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- Review React error boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Contact: [your-support-email]
