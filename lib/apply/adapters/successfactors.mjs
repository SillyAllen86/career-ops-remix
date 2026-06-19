import { BasePortalAdapter } from './base.mjs';
import { errorResult, manualCheckpointResult, successResult } from '../types.mjs';

const APPLY_SELECTORS = [
  'button:has-text("Apply")',
  'a:has-text("Apply")',
  'button:has-text("Apply Now")',
  'a:has-text("Apply Now")',
  'button:has-text("Start Application")',
];

const SIGNIN_SELECTORS = [
  'button:has-text("Sign In")',
  'a:has-text("Sign In")',
  'button:has-text("Log In")',
  'a:has-text("Log In")',
];

const NEXT_SELECTORS = [
  'button:has-text("Next")',
  'button:has-text("Continue")',
  'button:has-text("Review")',
  'button[type="submit"]',
];

export class SuccessFactorsAdapter extends BasePortalAdapter {
  async detectPortal() {
    const url = this.page.url();
    const text = await this.bodyText();
    const detected = this.portal?.ats_type === 'successfactors'
      || /successfactors|jobs2web/i.test(url)
      || /candidate profile|my profile|sap successfactors/i.test(text);
    return detected ? successResult({ detected: 'successfactors' }) : errorResult('Page does not look like SuccessFactors');
  }

  async ensureSession() {
    const targets = [this.portal.profile_url, this.portal.status_page_url, this.portal.login_entry_url].filter(Boolean);
    for (const target of targets) {
      await this.page.goto(target, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      const text = await this.bodyText();
      if (/candidate profile|my profile|my applications|saved jobs|sign out/i.test(text)) {
        await this.capture('successfactors-session-restored', { status: 'success' });
        return successResult({ authenticated: true, restored: true, source: target });
      }
    }
    return successResult({ authenticated: false, restored: false });
  }

  async openJob() {
    const targetUrl = (this.job.routing_mode === 'direct_apply_url' && this.job.apply_url) ? this.job.apply_url : (this.job.job_url || this.job.apply_url);
    if (!targetUrl) return errorResult('SuccessFactors job route missing job/apply URL');
    await this.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await this.capture('successfactors-open-job', { status: 'success' });
    return successResult({ targetUrl });
  }

  async enterApplyFlow() {
    const clicked = await this.clickFirstVisible(APPLY_SELECTORS);
    if (!clicked) return successResult({ entered: false });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.capture('successfactors-enter-apply-flow', { status: 'success', extra: { selector: clicked } });
    return successResult({ entered: true, selector: clicked });
  }

  async goToSignIn() {
    const clicked = await this.clickFirstVisible(SIGNIN_SELECTORS);
    if (!clicked) return successResult({ entered: false });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.capture('successfactors-go-to-sign-in', { status: 'success', extra: { selector: clicked } });
    return successResult({ entered: true, selector: clicked });
  }

  async signIn() {
    const formFill = await this.fillCredentialFields();
    if (formFill.status !== 'success') return formFill;
    const submit = await this.clickAdvanceButton([
      'button:has-text("Sign In")',
      'button[type="submit"]',
      'input[type="submit"]',
    ]);
    if (submit.status !== 'success') return submit;
    await this.capture('successfactors-sign-in-submitted', { status: 'success' });
    const checkpoint = await this.ensureNoCommonCheckpoint();
    if (checkpoint && checkpoint.reason !== 'final_review') return checkpoint;
    return successResult({ authenticated: true });
  }

  async advanceToReview() {
    for (let step = 1; step <= 8; step += 1) {
      await this.capture(`successfactors-step-${step}`, { status: 'info' });
      const checkpoint = await this.ensureNoCommonCheckpoint();
      if (checkpoint && checkpoint.reason !== 'final_review') return checkpoint;

      const text = await this.bodyText();
      if (/review and submit|submit application|application review/i.test(text)) {
        return manualCheckpointResult('final_review', 'Reached SuccessFactors review page; submit remains blocked');
      }

      const uploadResult = await this.uploadResume();
      if (uploadResult.status === 'error') return uploadResult;

      const fillResult = await this.fillProfile();
      if (fillResult.status === 'error') return fillResult;

      const questionResult = await this.fillApplicationQuestions();
      if (questionResult.status !== 'success') return questionResult;

      const advance = await this.clickAdvanceButton(NEXT_SELECTORS);
      if (advance.status !== 'success') return advance;
      if (!advance.clicked) return successResult({ stopped: 'no_advance_button_found' });
    }
    return errorResult('SuccessFactors flow exceeded safe step limit before review');
  }

  async readApplicationStatus() {
    const targetUrl = this.portal.status_page_url || this.portal.profile_url;
    if (!targetUrl) return errorResult('SuccessFactors status page URL not configured');
    await this.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await this.capture('successfactors-status-page', { status: 'success' });
    const text = await this.bodyText();
    if (!/my applications|candidate profile|job submissions/i.test(text)) {
      return errorResult('Saved SuccessFactors session is not authenticated for status sync');
    }
    const statuses = await this.page.evaluate(() => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      return Array.from(document.querySelectorAll('tr, [role="row"], li, article'))
        .map((row) => clean(row.innerText || row.textContent || ''))
        .filter((line) => /application|interview|offer|rejected|submitted|in progress/i.test(line))
        .slice(0, 25)
        .map((line) => ({ raw: line }));
    });
    return successResult({ statuses });
  }
}
