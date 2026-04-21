#!/usr/bin/env node

import { chromium } from 'playwright';

const TARGET_URL =
  'https://jobs.bayer.com/job/Leverkusen-Stream-Lead-Program-Manager-AI-Predictive-Decision-Science-%28alle-Geschlechter%29-Nord/1382717133/?utm_source=LINKEDIN&utm_medium=referrer';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

async function visibleTexts(locator, limit = 20) {
  const count = await locator.count();
  const items = [];
  for (let i = 0; i < Math.min(count, limit); i += 1) {
    const txt = clean(await locator.nth(i).innerText().catch(() => ''));
    if (txt) items.push(txt);
  }
  return items;
}

async function summarizePage(page, label) {
  console.log(`\n=== ${label} ===`);
  console.log('TITLE:', clean(await page.title()));
  console.log('URL:', page.url());

  const headings = await visibleTexts(page.locator('h1, h2, h3'), 10);
  console.log('HEADINGS:', JSON.stringify(headings, null, 2));

  const buttons = await visibleTexts(page.locator('button, [role=\"button\"], a'), 30);
  console.log('CLICKABLE_TEXTS:', JSON.stringify(buttons, null, 2));

  const inputs = await page.locator('input, select, textarea').evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      placeholder: el.getAttribute('placeholder') || '',
      aria: el.getAttribute('aria-label') || '',
    }))
  );
  console.log('FIELDS:', JSON.stringify(inputs.slice(0, 30), null, 2));
}

async function clickIfVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      try {
        await locator.click({ timeout: 3000 });
        return selector;
      } catch {
        // ignore and continue
      }
    }
  }
  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await summarizePage(page, 'LANDING');

    const cookieClicked = await clickIfVisible(page, [
      'button:has-text("Accept All Cookies")',
      'button:has-text("Accept All")',
      'button:has-text("Akzeptieren")',
      'button:has-text("Alle akzeptieren")',
      'button:has-text("Reject All Cookies")',
      'button:has-text("Confirm My Choices")',
    ]);
    if (cookieClicked) {
      await page.waitForLoadState('networkidle').catch(() => {});
      console.log('COOKIE_ACTION:', cookieClicked);
      await summarizePage(page, 'AFTER_COOKIES');
    }

    const applySelector = await (async () => {
      const candidates = [
        'a:has-text("Apply now")',
        'button:has-text("Apply now")',
        'a:has-text("Apply")',
        'button:has-text("Apply")',
        'a:has-text("Jetzt bewerben")',
        'button:has-text("Jetzt bewerben")',
        'a:has-text("Bewerben")',
        'button:has-text("Bewerben")',
        'a:has-text("LinkedIn")',
        'button:has-text("LinkedIn")',
      ];
      for (const selector of candidates) {
        const locator = page.locator(selector).first();
        if (await locator.count()) return selector;
      }
      return null;
    })();

    console.log('APPLY_SELECTOR_FOUND:', applySelector || 'NONE');

    if (applySelector) {
      const before = page.url();
      await page.locator(applySelector).first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const after = page.url();
      console.log('APPLY_CLICK_URL_CHANGE:', before, '=>', after);
      await summarizePage(page, 'AFTER_APPLY_CLICK');
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
