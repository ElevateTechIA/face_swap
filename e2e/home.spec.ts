import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/')

    // Check if page loads
    await expect(page).toHaveTitle(/Face Clone/)

    // Should not show error page
    await expect(page.locator('text=Error')).not.toBeVisible()
  })

  test('should display header with navigation', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Header should be visible
    const header = page.locator('header, nav').first()
    await expect(header).toBeVisible()
  })

  test('should have language switcher', async ({ page }) => {
    await page.goto('/')

    // Look for language switcher (globe icon or language flags)
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]')
    await expect(languageSwitcher).toBeVisible()
  })

  test('should redirect to locale path', async ({ page }) => {
    await page.goto('/')

    // Should redirect to /en/ or /es/
    await page.waitForURL(/\/(en|es)/)
    expect(page.url()).toMatch(/\/(en|es)/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out known harmless errors (like Firebase in dev mode)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('Firebase') &&
        !error.includes('DevTools') &&
        !error.includes('favicon')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
