import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('sign up flow', async ({ page }) => {
  test.setTimeout(60000)
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()))
  page.on('request', req => console.log('REQ:', req.method(), req.url()))
  page.on('response', res => console.log('RES:', res.status(), res.url()))
  await setupClerkTestingToken({ page })

  await page.goto('/sign-up')

  // The form has First name, Last name, Email, and Password inputs
  await page.locator('input[placeholder="First name"]').fill('Test')
  await page.locator('input[placeholder="Last name"]').fill('User')
  await page.locator('input[placeholder="Email address"]').fill(`test_${Date.now()}+clerk_test@example.com`)
  await page.locator('input[placeholder="Password"]').fill('L0ckedIn_T3st_P@ssw0rd!_2026')

  // Wait for the verification response before clicking to avoid a race condition
  const verificationResponse = page.waitForResponse(
    (resp) => resp.url().includes("prepare_verification") && resp.status() === 200
  );
  await page.locator('button:has-text("Create Account")').click();
  await verificationResponse;

  // Wait for the verification code screen
  await expect(page.locator('h1:has-text("Check your email")')).toBeVisible({ timeout: 20000 })

  // Enter test OTP code (424242 works with +clerk_test emails)
  await page.locator('input[type="text"]').nth(0).fill('4')
  await page.locator('input[type="text"]').nth(1).fill('2')
  await page.locator('input[type="text"]').nth(2).fill('4')
  await page.locator('input[type="text"]').nth(3).fill('2')
  await page.locator('input[type="text"]').nth(4).fill('4')
  await page.locator('input[type="text"]').nth(5).fill('2')

  // Give React state time to register the final input before clicking
  await page.waitForTimeout(500)

  await page.locator('button:has-text("Verify Email")').click()
  
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'after-verify.png' })
  console.log("URL AFTER VERIFY:", page.url())
  console.log("PAGE TEXT AFTER VERIFY:", await page.evaluate(() => document.body.innerText))
  
  await expect(page).toHaveURL(/.*\/onboarding/, { timeout: 60000 })
})
