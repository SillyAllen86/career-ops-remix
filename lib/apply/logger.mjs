import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { slugify } from './config.mjs';

function runStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function captureMarkers(page) {
  return page.evaluate(() => {
    const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const visibleText = (selector, limit = 8) => Array.from(document.querySelectorAll(selector))
      .map((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.visibility === 'hidden' || style.display === 'none') return null;
        if (rect.width < 2 || rect.height < 2) return null;
        return clean(element.innerText || element.textContent || '');
      })
      .filter(Boolean)
      .slice(0, limit);

    return {
      headings: visibleText('h1, h2, h3'),
      buttons: visibleText('button, a, [role="button"]', 12),
      labels: visibleText('label, legend', 12),
    };
  });
}

export function createRunLogger({ root = process.cwd(), portalId, runKind, jobUrl }) {
  const runDir = resolve(root, 'runtime', 'runs', `${runStamp()}-${slugify(portalId || 'portal')}-${slugify(runKind || 'run')}`);
  mkdirSync(runDir, { recursive: true });
  const logPath = resolve(runDir, 'events.jsonl');
  const summaryPath = resolve(runDir, 'summary.json');
  let index = 0;

  async function logPage(page, { step, status = 'info', detectedError = '', checkpointReason = '', extra = {} }) {
    index += 1;
    const stepSlug = `${String(index).padStart(2, '0')}-${slugify(step)}`;
    const screenshotPath = resolve(runDir, `${stepSlug}.png`);
    const htmlPath = resolve(runDir, `${stepSlug}.html`);
    let pageTitle = '';
    let pageUrl = '';
    let markers = {};

    try {
      pageTitle = await page.title();
      pageUrl = page.url();
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      writeFileSync(htmlPath, await page.content().catch(() => ''));
      markers = await captureMarkers(page).catch(() => ({}));
    } catch {
      // logger should not break the run.
    }

    const entry = {
      timestamp: new Date().toISOString(),
      portal: portalId,
      job_url: jobUrl,
      current_step: step,
      status,
      page_title: pageTitle,
      page_url: pageUrl,
      key_visible_markers: markers,
      screenshot_path: screenshotPath,
      html_snapshot_path: htmlPath,
      detected_error: detectedError,
      checkpoint_reason: checkpointReason,
      extra,
    };

    appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
    return entry;
  }

  function writeSummary(summary) {
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }

  return { runDir, logPath, summaryPath, logPage, writeSummary };
}
