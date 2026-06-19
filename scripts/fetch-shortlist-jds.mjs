#!/usr/bin/env node

import { chromium } from 'playwright';

const urls = process.argv.slice(2);

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

async function acceptCookies(page) {
  const selectors = [
    'button:has-text("Accept All Cookies")',
    'button:has-text("Accept All")',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Accept")',
  ];

  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      try {
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(300);
        return selector;
      } catch {
        // Keep trying.
      }
    }
  }

  return null;
}

async function fetchOne(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
    });

    await acceptCookies(page);

    const title = clean(await page.title());
    const headings = await page.locator('h1,h2,h3').evaluateAll((els) =>
      els.map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 12)
    ).catch(() => []);

    const body = clean(await page.locator('body').innerText().catch(() => '')).slice(0, 16000);
    const apply = await page.locator('a,button').evaluateAll((els) =>
      els
        .map((e) => ({
          text: (e.innerText || '').replace(/\s+/g, ' ').trim(),
          href: e.href || '',
          aria: e.getAttribute('aria-label') || '',
        }))
        .filter((x) => /apply|bewerb|profile|login|sign in|create account|view profile|job details/i.test(`${x.text} ${x.href} ${x.aria}`))
        .slice(0, 20)
    ).catch(() => []);

    return {
      url,
      finalUrl: page.url(),
      title,
      headings,
      body,
      apply,
    };
  } catch (error) {
    return {
      url,
      error: String(error?.message || error),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  if (urls.length === 0) {
    console.error('Usage: node scripts/fetch-shortlist-jds.mjs <url> [url...]');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const url of urls) {
      results.push(await fetchOne(browser, url));
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
