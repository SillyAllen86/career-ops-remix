#!/usr/bin/env node

import { chromium } from 'playwright';

const URL = 'https://jobs.bayer.com/?locale=en_US';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });

    for (const selector of [
      'button:has-text("Accept All Cookies")',
      'button:has-text("Accept All")',
      'button:has-text("Accept All Cookies")',
      'button:has-text("Alle Cookies akzeptieren")',
      'button:has-text("Accept")',
    ]) {
      const loc = page.locator(selector).first();
      if (await loc.count()) {
        await loc.click().catch(() => {});
        await page.waitForTimeout(500);
        break;
      }
    }

    const profile = page.locator('a:has-text("View Profile"), a:has-text("Profil anzeigen")').first();
    console.log('PROFILE_COUNT:', await profile.count());
    if (await profile.count()) {
      await profile.click({ timeout: 5000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    console.log('TITLE:', clean(await page.title()));
    console.log('URL:', page.url());
    console.log('BODY:', clean(await page.locator('body').innerText().catch(() => '')).slice(0, 2000));
    const fields = await page.locator('input,select,textarea').evaluateAll((els) =>
      els.map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.getAttribute('id') || '',
        placeholder: el.getAttribute('placeholder') || '',
        aria: el.getAttribute('aria-label') || '',
      }))
    );
    console.log('FIELDS:', JSON.stringify(fields.slice(0, 30), null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
