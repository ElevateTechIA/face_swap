import { test, expect } from '@playwright/test'

test.describe('Language Switching', () => {
  test('should switch from English to Spanish', async ({ page }) => {
    await page.goto('/en')

    // Find and click language switcher
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()

    // Click Spanish option
    await page.locator('text=Español').click()

    // Should navigate to Spanish version
    await page.waitForURL(/\/es/)
    expect(page.url()).toContain('/es')
  })

  test('should switch from Spanish to English', async ({ page }) => {
    await page.goto('/es')

    // Find and click language switcher
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()

    // Click English option
    await page.locator('text=English').click()

    // Should navigate to English version
    await page.waitForURL(/\/en/)
    expect(page.url()).toContain('/en')
  })

  test('should preserve path when switching languages', async ({ page }) => {
    await page.goto('/en')

    // Navigate to a specific page (if exists)
    // For now, just test from home

    const currentPath = new URL(page.url()).pathname.replace('/en', '')

    // Switch language
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()
    await page.locator('text=Español').click()

    // Path should be preserved
    await page.waitForURL(/\/es/)
    const newPath = new URL(page.url()).pathname.replace('/es', '')
    expect(newPath).toBe(currentPath)
  })

  test('should show current language with checkmark', async ({ page }) => {
    await page.goto('/en')

    // Open language switcher
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()

    // English option should have checkmark
    const englishOption = page.locator('text=English').locator('..')
    await expect(englishOption).toContainText('✓')
  })

  test('should display both language options', async ({ page }) => {
    await page.goto('/en')

    // Open language switcher
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()

    // Both options should be visible
    await expect(page.locator('text=Español')).toBeVisible()
    await expect(page.locator('text=English')).toBeVisible()
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    await page.goto('/en')

    // Open language switcher
    const languageSwitcher = page.locator('[title*="idioma"], [title*="language"]').first()
    await languageSwitcher.click()

    // Dropdown should be visible
    await expect(page.locator('text=Español')).toBeVisible()

    // Click outside
    await page.locator('body').click({ position: { x: 0, y: 0 } })

    // Dropdown should close
    await expect(page.locator('text=Español')).not.toBeVisible()
  })
})
