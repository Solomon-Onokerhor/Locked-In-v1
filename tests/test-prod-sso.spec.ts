import { test, expect } from '@playwright/test';

test('test prod sso', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure()?.errorText));

  await page.goto('https://lockedinumat.tech/sign-in');
  
  console.log('Page loaded');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'before-click.png' });
  
  console.log('Clicking Google Sign In...');
  const btn = page.locator('button:has-text("Continue with Google")');
  await btn.click({ force: true });
  
  await page.waitForTimeout(3000);
  
  console.log('After click');
  await page.screenshot({ path: 'after-click.png' });
});
