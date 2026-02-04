# GLOW Deployment Guide

This guide explains how the GLOW brand (nails templates) is configured using environment variables.

## How It Works (Simple!)

The app uses **environment variables** to determine which brand to load:

```
NEXT_PUBLIC_BRAND_NAME="GLOW"    → Shows GLOW brand + nails templates
NEXT_PUBLIC_BRAND_NAME="GLAMOUR" → Shows GLAMOUR brand + all other templates
```

### Flow:
1. App reads `NEXT_PUBLIC_BRAND_NAME` from environment
2. Loads that brand config from Firestore by name
3. Filters templates by the brand's `domain` field in Firestore
4. Shows only relevant templates

## Configuration

### Brand Configs in Firebase

1. **GLAMOUR**
   - Name: `GLAMOUR`
   - Domain: `localhost` (used for filtering templates)
   - Templates: 30 templates (party, editorial, etc.)
   - Logo: Default gradient

2. **GLOW**
   - Name: `GLOW`
   - Domain: `face-swap-nextjs-git-glow-elevatetechais-projects.vercel.app`
   - Templates: 2 templates (nails-related)
   - Logo: Custom uploaded logo

### Environment Variables

**Local Development** (`.env.local`):
```bash
NEXT_PUBLIC_BRAND_NAME="GLAMOUR"
```

**Vercel - GLOW Branch**:
```bash
NEXT_PUBLIC_BRAND_NAME="GLOW"
```

**Vercel - Main Branch**:
```bash
NEXT_PUBLIC_BRAND_NAME="GLAMOUR"
```

## Setup in Vercel

### 1. Configure Environment Variable for GLOW Branch

1. Go to [Vercel Dashboard](https://vercel.com/elevatetechais-projects/face-swap-nextjs)
2. Settings → Environment Variables
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_BRAND_NAME`
   - **Value**: `GLOW`
   - **Environment**: Select "Preview" (or specific branch "glow")
4. Save
5. Redeploy the branch

### 2. Current Template Distribution

```
GLOW Templates:
  - Winter Angel Face Swap
  - Nails

GLAMOUR Templates:
  - 30 other templates (party, editorial, cinematic, etc.)
```

Templates are filtered by matching the `websiteUrl` field with the brand's `domain` from Firestore.

## Testing

### Local Testing (GLAMOUR)
```bash
npm run dev
# Visit http://localhost:3000
# Should show: GLAMOUR brand with 30 templates
```

### Test GLOW Locally
```bash
# Temporarily change .env.local
NEXT_PUBLIC_BRAND_NAME="GLOW"

npm run dev
# Should show: GLOW brand with 2 nails templates
```

### Production Testing (GLOW)
Visit the glow branch deployment URL (check Vercel dashboard for exact URL)

**Expected behavior**:
- Header shows "GLOW v2.3.1" logo and name
- Only 2 nails templates appear
- No GLAMOUR templates visible

## Troubleshooting

### Check Server Logs

Look for these logs in Vercel Function logs or local console:

```
🔍 Loading brand config: GLOW (from env: NEXT_PUBLIC_BRAND_NAME)
✅ Brand config loaded: GLOW
   Domain in Firestore: face-swap-nextjs-git-glow-elevatetechais-projects.vercel.app
   Logo: Yes
```

### If wrong brand is showing:

1. **Check Vercel environment variables**:
   - Go to Vercel → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_BRAND_NAME` is set correctly for the branch
   - Redeploy if needed

2. **Check Firestore**:
   ```bash
   npx tsx scripts/verify-glow-setup.ts
   ```

3. **Verify templates are assigned correctly**:
   - GLOW templates should have `websiteUrl: "face-swap-nextjs-git-glow-elevatetechais-projects.vercel.app"`
   - GLAMOUR templates should have `websiteUrl: "localhost"`

### If all templates are showing:

The environment variable might not be set correctly. Check:
```bash
# In Vercel Function logs, you should see:
🔍 Loading brand config: GLOW (from env: NEXT_PUBLIC_BRAND_NAME)

# If you see:
🔍 Loading brand config: GLAMOUR (from env: NEXT_PUBLIC_BRAND_NAME)
# Then the env var is not set in Vercel
```

## Adding More Nail Templates

### Via Admin UI:
1. Go to `/admin` (logged in as admin)
2. Click "New Template"
3. Upload image
4. Select **GLOW** from "Website URL" dropdown
5. Add tags (nails, manicure, gel, etc.)
6. Save

### Via Script:
```bash
# Edit keywords in scripts/assign-templates-to-brands.ts
npx tsx scripts/assign-templates-to-brands.ts
```

## Advantages of This Approach

✅ **Simple**: Just set one environment variable
✅ **Reliable**: Works with any Vercel URL (preview, production, custom domain)
✅ **Flexible**: Easy to add new brands
✅ **Maintainable**: No domain matching logic
✅ **Scalable**: Can have unlimited brands

## Adding a New Brand

1. **Create brand in Firestore** via admin UI or script
2. **Assign templates** to the brand's domain
3. **Set environment variable** in Vercel:
   ```
   NEXT_PUBLIC_BRAND_NAME="NEW_BRAND_NAME"
   ```
4. Deploy!

## Future Enhancements

- [ ] Custom domains (glow.ai, glamour.app)
- [ ] Brand-specific theme colors
- [ ] Per-brand analytics
- [ ] Brand-specific landing pages
- [ ] Multiple brands on same deployment (subdomain routing)
