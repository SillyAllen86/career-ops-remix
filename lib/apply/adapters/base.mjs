import { fillBestField, findActiveForm, findVisibleFileInput } from '../form-targeting.mjs';
import { detectCheckpointFromText, errorResult, manualCheckpointResult, successResult } from '../types.mjs';

export class BasePortalAdapter {
  constructor({ page, portal, job, profile, credentials, logger, mode, neverSubmit, resumePath }) {
    this.page = page;
    this.portal = portal;
    this.job = job;
    this.profile = profile || {};
    this.credentials = credentials || {};
    this.logger = logger;
    this.mode = mode;
    this.neverSubmit = neverSubmit;
    this.resumePath = resumePath;
  }

  async capture(step, payload = {}) {
    if (this.logger) {
      await this.logger.logPage(this.page, { step, ...payload });
    }
  }

  candidateValues() {
    const fullName = this.profile?.candidate?.full_name || '';
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      fullName,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: this.profile?.candidate?.email || this.credentials?.user_id || this.credentials?.email || '',
      phone: this.profile?.candidate?.phone || '',
      location: this.profile?.candidate?.location || this.profile?.location?.city || '',
      city: this.profile?.location?.city || '',
      linkedin: this.profile?.candidate?.linkedin || '',
      website: this.profile?.candidate?.portfolio_url || this.profile?.candidate?.github || '',
    };
  }

  async bodyText() {
    return this.page.locator('body').innerText().catch(() => '');
  }

  async clickFirstVisible(selectors) {
    for (const selector of selectors) {
      const locator = this.page.locator(selector).first();
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

  async ensureNoCommonCheckpoint() {
    const text = await this.bodyText();
    const checkpoint = detectCheckpointFromText(text);
    if (checkpoint) {
      return manualCheckpointResult(checkpoint.reason, `Manual checkpoint detected: ${checkpoint.reason}`, { matched: checkpoint.matched });
    }
    return null;
  }

  async detectQuestionCheckpoint() {
    const text = await this.bodyText();
    const checkpoint = detectCheckpointFromText(text);
    if (checkpoint && checkpoint.reason !== 'final_review') {
      return manualCheckpointResult(checkpoint.reason, `Manual answer needed for ${checkpoint.reason}`, { source: 'visible_text' });
    }
    return null;
  }

  async fillCredentialFields() {
    const form = await findActiveForm(this.page, [
      { keywords: ['email', 'user', 'login'], weight: 4 },
      { keywords: ['password', 'passcode'], weight: 5 },
    ]);

    if (!form) return errorResult('No active sign-in form detected');

    const emailValue = this.credentials?.user_id || this.credentials?.email || this.profile?.candidate?.email;
    const passwordValue = this.credentials?.password;

    if (!emailValue || !passwordValue) {
      return errorResult('Missing portal credentials for this portal');
    }

    const emailField = await fillBestField(this.page, [
      { keywords: ['email', 'user', 'login'], weight: 5 },
    ], emailValue, { formKey: form.formKey });

    const passwordField = await fillBestField(this.page, [
      { keywords: ['password', 'passcode'], weight: 6 },
    ], passwordValue, { formKey: form.formKey });

    if (!emailField || !passwordField) {
      return errorResult('Could not target the active sign-in fields safely');
    }

    return successResult({ formKey: form.formKey, emailField, passwordField });
  }

  async fillSafeProfileFields() {
    const values = this.candidateValues();
    const fills = [
      [[{ keywords: ['first name', 'given name', 'firstname'], weight: 6 }], values.firstName],
      [[{ keywords: ['last name', 'surname', 'family name', 'lastname'], weight: 6 }], values.lastName],
      [[{ keywords: ['full name', 'legal name'], weight: 6 }], values.fullName],
      [[{ keywords: ['email'], weight: 6 }], values.email],
      [[{ keywords: ['phone', 'mobile'], weight: 6 }], values.phone],
      [[{ keywords: ['city'], weight: 5 }], values.city || values.location],
      [[{ keywords: ['location', 'address'], weight: 4 }], values.location],
      [[{ keywords: ['linkedin'], weight: 5 }], values.linkedin],
      [[{ keywords: ['website', 'portfolio', 'github'], weight: 5 }], values.website],
    ];

    const updated = [];
    for (const [intent, value] of fills) {
      if (!value) continue;
      const field = await fillBestField(this.page, intent, value).catch(() => null);
      if (field) updated.push(field.label || field.name || field.id || field.type);
    }
    return successResult({ updated });
  }

  async maybeUploadResume() {
    if (!this.resumePath) return successResult({ uploaded: false });
    const fileInput = await findVisibleFileInput(this.page);
    if (!fileInput) return successResult({ uploaded: false });
    await this.page.locator(`[data-hermes-field-key="${fileInput.domKey}"]`).setInputFiles(this.resumePath);
    return successResult({ uploaded: true, field: fileInput.label || fileInput.name || fileInput.id || 'file' });
  }

  async clickAdvanceButton(selectors) {
    const text = await this.bodyText();
    if (/submit application|review and submit|send application/i.test(text) && this.neverSubmit) {
      return manualCheckpointResult('final_review', 'Reached final review; submission intentionally blocked');
    }

    for (const selector of selectors) {
      const locator = this.page.locator(selector).first();
      if (!await locator.count()) continue;
      const label = (await locator.innerText().catch(() => '')).trim();
      if (/submit|send application|apply now/i.test(label) && this.neverSubmit) {
        return manualCheckpointResult('final_review', 'Submit control detected; stopping before submit', { button_text: label });
      }
      try {
        await locator.click({ timeout: 3000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await this.page.waitForTimeout(800);
        return successResult({ clicked: true, selector, label });
      } catch {
        // continue
      }
    }
    return successResult({ clicked: false });
  }

  async detectPortal() {
    return successResult({ detected: this.portal?.ats_type || 'other' });
  }

  async ensureSession() {
    return successResult({ authenticated: false, restored: false });
  }

  async openJob() {
    const targetUrl = this.job.apply_url || this.job.job_url;
    if (!targetUrl) return errorResult('Missing job URL and apply URL');
    await this.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    return successResult({ targetUrl });
  }

  async enterApplyFlow() {
    return successResult({ entered: false });
  }

  async goToSignIn() {
    return successResult({ entered: false });
  }

  async signIn() {
    return errorResult('signIn() not implemented for this adapter');
  }

  async uploadResume() {
    return this.maybeUploadResume();
  }

  async fillProfile() {
    return this.fillSafeProfileFields();
  }

  async fillApplicationQuestions() {
    const checkpoint = await this.detectQuestionCheckpoint();
    if (checkpoint) return checkpoint;
    return successResult({ handled: 'safe_fields_only' });
  }

  async advanceToReview() {
    return errorResult('advanceToReview() not implemented for this adapter');
  }

  async readApplicationStatus() {
    return successResult({ statuses: [] });
  }
}
