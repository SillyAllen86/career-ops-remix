#!/usr/bin/env node

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'urls.txt');
const OUTPUT = resolve(ROOT, 'output', 'job-url-scrape-2026-04-17.json');

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function parseUrls(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line));
}

async function acceptCookies(page) {
  const selectors = [
    'button:has-text("Accept All Cookies")',
    'button:has-text("Accept All")',
    'button:has-text("Alle Cookies akzeptieren")',
    'button:has-text("Accept all cookies")',
    'button:has-text("Akzeptieren")',
    'button:has-text("Confirm My Choices")',
    'button:has-text("Alle akzeptieren")',
  ];
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      try {
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(300);
        return selector;
      } catch {
        // continue
      }
    }
  }
  return null;
}

async function scrapeOne(browser, url, idx) {
  const page = await browser.newPage();
  const result = {
    index: idx + 1,
    url,
    finalUrl: '',
    title: '',
    headings: [],
    bodySnippet: '',
    applyTexts: [],
    error: '',
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1500);
    });
    await acceptCookies(page);
    await page.waitForTimeout(600);

    result.finalUrl = page.url();
    result.title = clean(await page.title());
    result.headings = (await page.locator('h1,h2,h3').evaluateAll((els) =>
      els.map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 10)
    ).catch(() => []));
    result.bodySnippet = clean(await page.locator('body').innerText().catch(() => '')).slice(0, 4500);
    result.applyTexts = (await page.locator('a,button').evaluateAll((els) =>
      els
        .map((e) => ({
          text: (e.innerText || '').replace(/\s+/g, ' ').trim(),
          href: e.href || '',
          aria: e.getAttribute('aria-label') || '',
        }))
        .filter((x) => /apply|bewerb|linkedin|profile|career|job details|view profile|sign in|create account/i.test(`${x.text} ${x.href} ${x.aria}`))
        .slice(0, 20)
    ).catch(() => []));
  } catch (error) {
    result.error = String(error?.message || error);
  } finally {
    await page.close().catch(() => {});
  }

  return result;
}

async function main() {
  const urls = parseUrls(readFileSync(INPUT, 'utf8'));
  mkdirSync(resolve(ROOT, 'output'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const out = [];
  try {
    for (let i = 0; i < urls.length; i += 1) {
      console.error(`Scraping ${i + 1}/${urls.length}: ${urls[i]}`);
      out.push(await scrapeOne(browser, urls[i], i));
    }
  } finally {
    await browser.close();
  }
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2));
  console.log(OUTPUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
