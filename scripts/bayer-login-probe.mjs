#!/usr/bin/env node

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { chromium } from 'playwright';

const ENTRY_URL = 'https://jobs.bayer.com/?locale=en_US';
const creds = load(readFileSync(new URL('../secrets/portal-credentials.yml', import.meta.url), 'utf8'));
const bayer = creds?.bayer;

if (!bayer?.user_id || !bayer?.password) {
  console.error('Missing Bayer credentials in secrets/portal-credentials.yml');
  process.exit(1);
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

async function visibleTexts(locator, limit = 25) {
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
  console.log('HEADINGS:', JSON.stringify(await visibleTexts(page.locator('h1,h2,h3'), 12), null, 2));
  console.log('BUTTONS:', JSON.stringify(await visibleTexts(page.locator('button,a,[role="button"]'), 35), null, 2));
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
}

async function clickIfVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      try {
        await locator.click({ timeout: 3000 });
        return selector;
      } catch {
        // continue
      }
    }
  }
  return null;
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      try {
        await locator.fill(value, { timeout: 3000 });
        return selector;
      } catch {
        // continue
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
    await page.goto(ENTRY_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await summarizePage(page, 'PORTAL_LANDING');

    const cookieClicked = await clickIfVisible(page, [
      'button:has-text("Accept All Cookies")',
      'button:has-text("Accept All")',
      'button:has-text("Alle Cookies akzeptieren")',
      'button:has-text("Confirm My Choices")',
    ]);
    if (cookieClicked) {
      await page.waitForLoadState('networkidle').catch(() => {});
      console.log('COOKIE_ACTION:', cookieClicked);
    }

    const profileClicked = await clickIfVisible(page, [
      'a:has-text("View Profile")',
      'a:has-text("Profil anzeigen")',
      'button:has-text("View Profile")',
      'button:has-text("Profil anzeigen")',
    ]);
    console.log('PROFILE_ACTION:', profileClicked || 'NONE');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await summarizePage(page, 'LOGIN_ENTRY');

    const userSelector = await fillFirst(page, [
      'input[type="email"]',
      'input[name*="email"]',
      'input[id*="email"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[name*="user" i]',
      'input[id*="user" i]',
      'input[name*="login" i]',
      'input[id*="login" i]',
      'input[type="text"]',
    ], bayer.user_id);

    const passSelector = await fillFirst(page, [
      'input[type="password"]',
      'input[name*="password"]',
      'input[id*="password"]',
      'input[name*="pass" i]',
      'input[id*="pass" i]',
    ], bayer.password);

    console.log('FILLED_USER_SELECTOR:', userSelector || 'NONE');
    console.log('FILLED_PASS_SELECTOR:', passSelector || 'NONE');

    const loginClicked = await clickIfVisible(page, [
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Log in")',
      'button:has-text("Anmelden")',
      'input[type="submit"]',
      'button[type="submit"]',
      'a:has-text("Sign In")',
    ]);
    console.log('LOGIN_ACTION:', loginClicked || 'NONE');

    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await summarizePage(page, 'AFTER_LOGIN_ATTEMPT');

    const body = clean(await page.locator('body').innerText().catch(() => ''));
    const bodySnippet = body.slice(0, 2000);
    console.log('BODY_SNIPPET:', bodySnippet);

    const loggedInSignals = [
      /sign out/i,
      /abmelden/i,
      /my profile/i,
      /my applications/i,
      /jobs applied/i,
      /saved applications/i,
      /candidate profile/i,
      /mein profil/i,
      /bewerbungen/i,
    ];
    console.log('LOGIN_SUCCESS_SIGNAL:', loggedInSignals.some((re) => re.test(body)) ? 'LIKELY' : 'UNCLEAR');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
