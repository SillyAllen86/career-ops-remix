const NOISE_PATTERN = /search|filter|keyword|newsletter|subscribe|alert/i;

export function scoreFieldCandidate(candidate, intents = []) {
  const haystack = [
    candidate.label,
    candidate.aria,
    candidate.name,
    candidate.id,
    candidate.placeholder,
    candidate.type,
  ].join(' ').toLowerCase();

  let score = 0;
  for (const intent of intents) {
    for (const keyword of intent.keywords || []) {
      if (haystack.includes(String(keyword).toLowerCase())) {
        score += intent.weight || 1;
        if (candidate.label?.toLowerCase().includes(String(keyword).toLowerCase())) score += 2;
        if (candidate.aria?.toLowerCase().includes(String(keyword).toLowerCase())) score += 1;
      }
    }
  }

  if (candidate.visible) score += 2;
  if (candidate.enabled) score += 2;
  if (candidate.type === 'email') score += 1;
  if (NOISE_PATTERN.test(haystack)) score -= 8;
  return score;
}

export async function collectVisibleFields(page) {
  return page.evaluate((noiseSource) => {
    const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const noisePattern = new RegExp(noiseSource, 'i');
    const getLabel = (element) => {
      const ariaLabel = element.getAttribute('aria-label') || '';
      if (ariaLabel) return clean(ariaLabel);
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelNode = document.getElementById(labelledBy);
        if (labelNode) return clean(labelNode.textContent || '');
      }
      if (element.id) {
        const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (label) return clean(label.textContent || '');
      }
      const wrappingLabel = element.closest('label');
      if (wrappingLabel) return clean(wrappingLabel.textContent || '');
      const fieldWrapper = element.closest('[role="group"], .formField, .field, .question, .css-175oi2r');
      if (fieldWrapper) {
        const localLabel = fieldWrapper.querySelector('label, legend, [data-automation-id="formLabel"]');
        if (localLabel) return clean(localLabel.textContent || '');
      }
      return '';
    };

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !(style.display === 'none' || style.visibility === 'hidden' || rect.width < 2 || rect.height < 2);
    };

    const isEnabled = (element) => !element.disabled && !element.getAttribute('aria-disabled');

    const fields = Array.from(document.querySelectorAll('input, select, textarea'))
      .map((element, index) => {
        if (!element.dataset.hermesFieldKey) {
          element.dataset.hermesFieldKey = `hermes-field-${index}-${Math.random().toString(36).slice(2, 8)}`;
        }

        const rect = element.getBoundingClientRect();
        const form = element.closest('form, [role="form"], [data-automation-id="formContainer"]');
        const label = getLabel(element);
        return {
          domKey: element.dataset.hermesFieldKey,
          tag: element.tagName.toLowerCase(),
          type: (element.getAttribute('type') || '').toLowerCase(),
          name: element.getAttribute('name') || '',
          id: element.id || '',
          placeholder: element.getAttribute('placeholder') || '',
          aria: element.getAttribute('aria-label') || '',
          label,
          value: element.value || '',
          visible: isVisible(element),
          enabled: isEnabled(element),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          formKey: form?.getAttribute('id') || form?.getAttribute('name') || form?.getAttribute('data-automation-id') || form?.tagName || 'document',
        };
      })
      .filter((field) => field.visible && field.enabled)
      .filter((field) => !['hidden', 'submit', 'button', 'reset'].includes(field.type))
      .filter((field) => !noisePattern.test([field.label, field.name, field.id, field.placeholder].join(' ')));

    const dedup = new Map();
    for (const field of fields) {
      const key = [field.formKey, field.label, field.name, field.id, field.placeholder, field.type, field.x, field.y].join('|').toLowerCase();
      if (!dedup.has(key)) dedup.set(key, field);
    }
    return Array.from(dedup.values());
  }, NOISE_PATTERN.source);
}

export function pickBestForm(fields, hints = []) {
  const buckets = new Map();
  for (const field of fields) {
    const existing = buckets.get(field.formKey) || { formKey: field.formKey, fields: [], score: 0 };
    existing.fields.push(field);
    existing.score += scoreFieldCandidate(field, hints);
    if (field.type === 'password') existing.score += 3;
    buckets.set(field.formKey, existing);
  }
  return Array.from(buckets.values()).sort((a, b) => b.score - a.score || b.fields.length - a.fields.length)[0] || null;
}

export async function findActiveForm(page, hints = []) {
  const fields = await collectVisibleFields(page);
  const form = pickBestForm(fields, hints);
  return form ? { ...form, topFields: form.fields.sort((a, b) => scoreFieldCandidate(b, hints) - scoreFieldCandidate(a, hints)).slice(0, 5) } : null;
}

export async function findBestField(page, intents, options = {}) {
  const fields = await collectVisibleFields(page);
  const filtered = options.formKey ? fields.filter((field) => field.formKey === options.formKey) : fields;
  const ranked = filtered
    .map((field) => ({ ...field, _score: scoreFieldCandidate(field, intents) }))
    .filter((field) => field._score > 0)
    .sort((a, b) => b._score - a._score || a.y - b.y);
  return ranked[0] || null;
}

export async function fillBestField(page, intents, value, options = {}) {
  const field = await findBestField(page, intents, options);
  if (!field) return null;
  const locator = page.locator(`[data-hermes-field-key="${field.domKey}"]`).first();
  await locator.fill(String(value ?? ''));
  return field;
}

export async function findVisibleFileInput(page) {
  const fields = await collectVisibleFields(page);
  return fields.find((field) => field.type === 'file') || null;
}
