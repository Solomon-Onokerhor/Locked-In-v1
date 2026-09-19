import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('sign up flow', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()))
  await setupClerkTestingToken({ page })

  await page.goto('/sign-up')

  // The form has First name, Last name, Email, and Password inputs
  await page.locator('input[placeholder="First name"]').fill('Test')
  await page.locator('input[placeholder="Last name"]').fill('User')
  await page.locator('input[placeholder="Email address"]').fill(`test+${Date.now()}@example.com`)
  await page.locator('input[placeholder="Password"]').fill('TestPassword123!')

  await page.locator('button:has-text("Create Account")').click()

  // Wait for network idle or error
  await page.waitForTimeout(2000)
  
  await page.screenshot({ path: 'test-failure.png' })
  
  const pageText = await page.evaluate(() => document.body.innerText)
  console.log("PAGE TEXT:", pageText)

  // Wait for the verification code screen
  await expect(page.locator('h1:has-text("Check your email")')).toBeVisible()

  // The custom verification screen has a 6-digit OTP code input
  const otpInputs = page.locator('input[type="text"]').first()
  // Wait for the OTP input to be visible
  await otpInputs.waitFor()
  
  // Note: Since this is an e2e test against a dev environment,
  // we would typically use the magic code "424242" for testing
  // But wait! Clerk Testing tokens actually bypass verification entirely if configured, 
  // or use the testing OTP. The testing OTP is 424242.
  await otpInputs.fill('4')
  await page.locator('input[type="text"]').nth(1).fill('2')
  await page.locator('input[type="text"]').nth(2).fill('4')
  await page.locator('input[type="text"]').nth(3).fill('2')
  await page.locator('input[type="text"]').nth(4).fill('4')
  await page.locator('input[type="text"]').nth(5).fill('2')

  await page.locator('button:has-text("Verify Email")').click()

  // Assert it completes and redirects
  await expect(page).toHaveURL('/')
})
