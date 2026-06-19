export const ATS_TYPES = ['workday', 'successfactors', 'greenhouse', 'lever', 'cornerstone', 'other'];
export const RUN_MODES = ['inspect_only', 'fill_until_manual_checkpoint', 'fill_until_review', 'never_submit'];
export const MANUAL_CHECKPOINT_REASONS = [
  'mfa',
  'email_code',
  'captcha',
  'salary_input',
  'work_authorization',
  'notice_period',
  'relocation',
  'final_review',
];

const CHECKPOINT_RULES = [
  { reason: 'captcha', patterns: [/captcha/i, /i am not a robot/i, /recaptcha/i, /cloudflare/i] },
  { reason: 'mfa', patterns: [/multi-factor/i, /two-factor/i, /verification app/i, /authenticator/i, /one-time passcode/i, /security key/i] },
  { reason: 'email_code', patterns: [/email code/i, /verification code/i, /check your email/i, /enter the code/i, /6-digit code/i] },
  {
    reason: 'salary_input',
    patterns: [
      /salary expectation/i,
      /salary requirement/i,
      /desired salary/i,
      /current salary/i,
      /expected salary/i,
      /compensation expectation/i,
      /pay expectation/i,
      /desired pay/i,
      /annual pay/i,
      /hourly rate/i,
    ],
  },
  { reason: 'work_authorization', patterns: [/work authorization/i, /authorized to work/i, /sponsorship/i, /visa/i, /employment eligibility/i] },
  { reason: 'notice_period', patterns: [/notice period/i, /start date/i, /available to start/i, /when can you start/i] },
  { reason: 'relocation', patterns: [/relocat/i, /willing to move/i, /commute/i, /onsite requirement/i] },
  { reason: 'final_review', patterns: [/review and submit/i, /submit application/i, /final review/i, /ready to submit/i] },
];

export function normalizeRunMode(value) {
  if (!value) return 'fill_until_review';
  return RUN_MODES.includes(value) ? value : 'fill_until_review';
}

export function normalizeNeverSubmit(value) {
  if (value === false || value === 'false' || value === '0') return false;
  return true;
}

export function makeResult(status, data = {}) {
  return { status, ...data };
}

export function successResult(data = {}) {
  return makeResult('success', data);
}

export function manualCheckpointResult(reason, message, data = {}) {
  return makeResult('manual_checkpoint_needed', {
    reason,
    message,
    ...data,
  });
}

export function errorResult(message, data = {}) {
  return makeResult('error', {
    message,
    ...data,
  });
}

export function detectCheckpointFromText(input = '') {
  const text = Array.isArray(input) ? input.filter(Boolean).join('\n') : String(input || '');
  for (const rule of CHECKPOINT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return { reason: rule.reason, matched: pattern.source };
      }
    }
  }
  return null;
}

export function summarizeOutcome(result) {
  if (!result) return 'unknown';
  if (result.status === 'manual_checkpoint_needed') {
    return `manual checkpoint: ${result.reason}`;
  }
  if (result.status === 'error') {
    return `error: ${result.message}`;
  }
  return 'success';
}
