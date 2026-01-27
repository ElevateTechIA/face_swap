# GLOW Deployment Guide

This guide explains how the GLOW brand (nails templates) is configured to work on the Vercel deployment.

## Current Configuration

### Brand Configs in Firebase

1. **GLAMOUR** (localhost)
   - Domain: `localhost`
   - Templates: 30 templates (all non-nails templates)
   - Visible when: Accessing via localhost:3000

2. **GLOW** (Vercel production)
   - Domain: `face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app`
   - Templates: 2 templates (nails-related only)
   - Visible when: Accessing via the Vercel URL

## How It Works

### 1. Domain Detection
When a user visits the app, the server:
1. Reads the `host` header from the request
2. Normalizes the domain (removes www, protocol, port, trailing slash)
3. Queries Firestore for a matching `brandConfig`
4. Loads the corresponding brand (logo, name, etc.)

### 2. Template Filtering
The templates API filters based on `websiteUrl`:
- Templates with `websiteUrl === brand.domain` → shown
- Templates with `websiteUrl === null` → shared, shown on all sites
- Templates with different `websiteUrl` → hidden

### 3. Current Template Distribution

```
GLOW Templates (face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app):
  - Winter Angel Face Swap (nails)
  - Nails (nails)

GLAMOUR Templates (localhost):
  - 30 other templates (party, editorial, etc.)
```

## Recent Fixes

### 1. Domain Normalization (2026-01-27)
**Issue**: The domain normalization wasn't removing port numbers (`:3000`)

**Fix**: Updated `lib/brand/brand-service.ts` to remove ports during normalization:
```typescript
const normalizedDomain = domain
  .replace(/^(https?:\/\/)?(www\.)?/, '')
  .replace(/:\d+$/, '') // Remove port
  .replace(/\/$/, '')
  .toLowerCase();
```

### 2. Brand Name Typo
**Issue**: Localhost brand was named "GLAMOURs" instead of "GLAMOUR"

**Fix**: Updated the brand name in Firestore to "GLAMOUR"

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Should load GLAMOUR brand with 30 templates
```

### Production Testing
Visit: https://face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app/en

**Expected behavior**:
- Header shows "GLOW" logo and name
- Only 2 templates appear (nails-related)
- No GLAMOUR templates visible

## Troubleshooting

### If all templates are showing on Vercel:

1. **Check server logs** for domain detection:
   - Should see: `🔍 Looking up brand config for domain: face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app`
   - Should see: `✅ Brand config loaded: GLOW`

2. **Check template filtering**:
   - Should see: `🔍 Loading templates for brand: GLOW (face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app)`
   - Should see: `✅ Loaded 2 templates (mode: all)`

3. **Verify Firestore data**:
   ```bash
   npx tsx scripts/verify-glow-setup.ts
   ```

### If brand logo/name is wrong:

1. Check that the Vercel domain exactly matches the one in Firestore
2. Verify the brand is marked as `isActive: true`
3. Check for typos in the domain

## Adding More Nail Templates

To add more templates to GLOW:

1. Go to `/admin` page (logged in as admin)
2. Click "New Template"
3. Upload template image
4. In the "Website URL" dropdown, select "GLOW (face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app)"
5. Add relevant tags (nails, manicure, etc.)
6. Click "Create Template"

Or use the bulk assignment script:
```bash
# Edit scripts/assign-templates-to-brands.ts to update keywords
npx tsx scripts/assign-templates-to-brands.ts
```

## Future Enhancements

- [ ] Add custom domain (e.g., glow.ai) instead of Vercel subdomain
- [ ] Custom theme colors for GLOW brand
- [ ] Separate analytics for each brand
- [ ] Brand-specific landing pages
