import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

const ROUTES_TO_TEST = [
  '/onboarding',
  '/',
  '/arsenal',
  '/buddies',
  '/leaderboard',
  '/resources',
  '/create-room',
  '/admin' // Good to verify it gracefully handles unauthorized access
]

test.describe('Global Smoke Test', () => {
  test('crawls all major routes without crashing', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes for crawling all pages
    
    // Track errors to fail the test if the app throws severe exceptions
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))
    
    await setupClerkTestingToken({ page })

    console.log('1. Authenticating test user...')
    await page.goto('/sign-up')

    await page.locator('input[placeholder="First name"]').fill('Smoke')
    await page.locator('input[placeholder="Last name"]').fill('Tester')
    await page.locator('input[placeholder="Email address"]').fill(`smoke_${Date.now()}+clerk_test@example.com`)
    await page.locator('input[placeholder="Password"]').fill('L0ckedIn_T3st_P@ssw0rd!_2026')

    const verificationResponse = page.waitForResponse(
      (resp) => resp.url().includes("prepare_verification") && resp.status() === 200,
      { timeout: 20000 }
    )
    await page.locator('button:has-text("Create Account")').click()
    await verificationResponse

    await expect(page.locator('h1:has-text("Check your email")')).toBeVisible({ timeout: 20000 })

    await page.locator('input[type="text"]').nth(0).fill('4')
    await page.locator('input[type="text"]').nth(1).fill('2')
    await page.locator('input[type="text"]').nth(2).fill('4')
    await page.locator('input[type="text"]').nth(3).fill('2')
    await page.locator('input[type="text"]').nth(4).fill('4')
    await page.locator('input[type="text"]').nth(5).fill('2')

    await page.waitForTimeout(500)
    await page.locator('button:has-text("Verify Email")').click()
    
    await expect(page).toHaveURL(/.*\/onboarding/, { timeout: 60000 })
    console.log('✅ Authentication successful!')

    console.log('2. Crawling routes...')
    for (const route of ROUTES_TO_TEST) {
      console.log(`Checking ${route}...`)
      
      // Use domcontentloaded to speed up checks since we don't need full hydration for a 500 check
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      
      // We expect the app to handle routes gracefully. 
      // 200 = OK. 307/308 = Redirect (Next.js middleware). 401/403 = Unauthorized. 
      // 500 = Server crash (BAD!)
      if (response) {
        expect(response.status()).toBeLessThan(500)
      }
      
      // Give the page a moment to render and potentially trigger client-side React crashes
      await page.waitForTimeout(1500) 
      
      // Ensure the Next.js generic 404/500 text isn't present
      const bodyText = await page.evaluate(() => document.body.innerText)
      expect(bodyText).not.toContain('Application error: a client-side exception has occurred')
      expect(bodyText).not.toContain('This page could not be found.')
      
      console.log(`✅ ${route} passed!`)
    }

    console.log('3. Verifying no fatal page errors...')
    expect(pageErrors.length).toBe(0)
    
    console.log('🚀 SMOKE TEST COMPLETE: All inches covered successfully!')
  })
})
