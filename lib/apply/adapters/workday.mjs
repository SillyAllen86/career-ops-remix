import { BasePortalAdapter } from './base.mjs';
import { errorResult, manualCheckpointResult, successResult } from '../types.mjs';

const APPLY_SELECTORS = [
  'button:has-text("Apply")',
  'a:has-text("Apply")',
  'button:has-text("Apply Now")',
  'a:has-text("Apply Now")',
  'button:has-text("Apply Manually")',
  'a:has-text("Apply Manually")',
  'button:has-text("Use My Last Application")',
  'button:has-text("Autofill with Resume")',
];

const SIGNIN_SELECTORS = [
  'button:has-text("Sign In")',
  'a:has-text("Sign In")',
  'button:has-text("Already have an account")',
  'a:has-text("Already have an account")',
  'button:has-text("Log In")',
];

const SUBMIT_SELECTORS = [
  'button:has-text("Next")',
  'button:has-text("Continue")',
  'button:has-text("Review")',
  'button:has-text("Review and Submit")',
  'button[data-automation-id="pageFooterNextButton"]',
  'button[data-automation-id="bottom-navigation-next-button"]',
];

export class WorkdayAdapter extends BasePortalAdapter {
  async detectPortal() {
    const url = this.page.url();
    const text = await this.bodyText();
    const detected = this.portal?.ats_type === 'workday'
      || /workday/i.test(url)
      || /workday/i.test(text)
      || /my information|my experience|application questions|review/i.test(text);
    return detected ? successResult({ detected: 'workday' }) : errorResult('Page does not look like Workday');
  }

  async ensureSession() {
    const targets = [this.portal.profile_url, this.portal.status_page_url, this.portal.login_entry_url].filter(Boolean);
    for (const target of targets) {
      await this.page.goto(target, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      const text = await this.bodyText();
      if (/candidate home|my applications|my profile|sign out|account settings/i.test(text)) {
        await this.capture('workday-session-restored', { status: 'success' });
        return successResult({ authenticated: true, restored: true, source: target });
      }
    }
    return successResult({ authenticated: false, restored: false });
  }

  async openJob() {
    const targetUrl = (this.job.routing_mode === 'direct_apply_url' && this.job.apply_url) ? this.job.apply_url : (this.job.job_url || this.job.apply_url);
    if (!targetUrl) return errorResult('Workday job route missing job/apply URL');
    await this.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await this.capture('workday-open-job', { status: 'success' });
    return successResult({ targetUrl });
  }

  async enterApplyFlow() {
    if (this.job.routing_mode === 'direct_apply_url' && this.job.apply_url) {
      await this.page.goto(this.job.apply_url, { waitUntil: 'networkidle', timeout: 45000 });
      await this.capture('workday-direct-apply-entry', { status: 'success' });
      return successResult({ entered: true, entry: 'direct_apply_url' });
    }

    const clicked = await this.clickFirstVisible(APPLY_SELECTORS);
    if (clicked) {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await this.capture('workday-enter-apply-flow', { status: 'success', extra: { selector: clicked } });
      return successResult({ entered: true, selector: clicked });
    }

    return successResult({ entered: false });
  }

  async goToSignIn() {
    const clicked = await this.clickFirstVisible(SIGNIN_SELECTORS);
    if (clicked) {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await this.capture('workday-go-to-sign-in', { status: 'success', extra: { selector: clicked } });
      return successResult({ entered: true, selector: clicked });
    }
    return successResult({ entered: false });
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
    await this.capture('workday-sign-in-submitted', { status: 'success' });

    const checkpoint = await this.ensureNoCommonCheckpoint();
    if (checkpoint && !/final_review/.test(checkpoint.reason)) return checkpoint;

    const text = await this.bodyText();
    if (/invalid|incorrect password|unable to sign in|something went wrong/i.test(text)) {
      return errorResult('Workday sign-in did not complete cleanly');
    }
    return successResult({ authenticated: true });
  }

  async isReviewPage() {
    const text = await this.bodyText();
    return /review and submit|submit application|review$/i.test(text) || /my information\s+my experience\s+application questions\s+review/i.test(text);
  }

  async advanceToReview() {
    for (let step = 1; step <= 8; step += 1) {
      await this.capture(`workday-step-${step}`, { status: 'info' });

      const checkpoint = await this.ensureNoCommonCheckpoint();
      if (checkpoint && checkpoint.reason !== 'final_review') return checkpoint;

      if (await this.isReviewPage()) {
        return manualCheckpointResult('final_review', 'Reached Workday review page; submission intentionally blocked');
      }

      const uploadResult = await this.uploadResume();
      if (uploadResult.status === 'error') return uploadResult;

      const fillResult = await this.fillProfile();
      if (fillResult.status === 'error') return fillResult;

      const questionResult = await this.fillApplicationQuestions();
      if (questionResult.status !== 'success') return questionResult;

      const advance = await this.clickAdvanceButton(SUBMIT_SELECTORS);
      if (advance.status !== 'success') return advance;
      if (!advance.clicked) {
        const text = await this.bodyText();
        if (/submit application|review and submit/i.test(text)) {
          return manualCheckpointResult('final_review', 'Reached Workday final review; submit remains blocked');
        }
        return successResult({ stopped: 'no_advance_button_found' });
      }
    }

    return errorResult('Workday flow exceeded safe step limit before reaching review');
  }

  async readApplicationStatus() {
    const targetUrl = this.portal.status_page_url || this.portal.profile_url;
    if (!targetUrl) return errorResult('Workday status page URL not configured');
    await this.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await this.capture('workday-status-page', { status: 'success' });

    const text = await this.bodyText();
    if (!/my applications|candidate home|applications/i.test(text)) {
      return errorResult('Saved Workday session is not authenticated for status sync');
    }

    const statuses = await this.page.evaluate(() => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const rows = Array.from(document.querySelectorAll('tr, [role="row"], li, article'));
      return rows
        .map((row) => clean(row.innerText || row.textContent || ''))
        .filter((line) => /application|applied|in review|interview|offer|rejected|submitted/i.test(line))
        .slice(0, 25)
        .map((line) => ({ raw: line }));
    });
    return successResult({ statuses });
  }
}
