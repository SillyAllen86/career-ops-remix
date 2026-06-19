import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../../schemas/cv.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

export { schema as cvSchema };

export function validateCvJson(data, currentSchema = schema) {
  const errors = [];
  walk(data, currentSchema, '$', errors);
  if (errors.length > 0) {
    const message = ['CV JSON validation failed:', ...errors.map((err) => `- ${err}`)].join('\n');
    const error = new Error(message);
    error.validationErrors = errors;
    throw error;
  }
  return true;
}

function walk(value, schemaNode, path, errors) {
  if (!schemaNode || typeof schemaNode !== 'object') return;

  if (schemaNode.const !== undefined && value !== schemaNode.const) {
    errors.push(`${path} must equal ${JSON.stringify(schemaNode.const)}.`);
    return;
  }

  if (schemaNode.enum && !schemaNode.enum.includes(value)) {
    errors.push(`${path} must be one of ${schemaNode.enum.join(', ')}.`);
    return;
  }

  if (schemaNode.type && !matchesType(value, schemaNode.type)) {
    errors.push(`${path} must be of type ${schemaNode.type}.`);
    return;
  }

  if (schemaNode.format === 'date-time' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be a valid ISO date-time string.`);
  }

  if (schemaNode.minLength !== undefined && typeof value === 'string' && value.length < schemaNode.minLength) {
    errors.push(`${path} must have length >= ${schemaNode.minLength}.`);
  }

  if (typeof value === 'string' && value.trim().length === 0 && (schemaNode.minLength ?? 1) > 0) {
    errors.push(`${path} must not be blank.`);
  }

  if (schemaNode.pattern && typeof value === 'string') {
    const regex = new RegExp(schemaNode.pattern);
    if (!regex.test(value)) {
      errors.push(`${path} must match pattern ${schemaNode.pattern}.`);
    }
  }

  if (schemaNode.minimum !== undefined && typeof value === 'number' && value < schemaNode.minimum) {
    errors.push(`${path} must be >= ${schemaNode.minimum}.`);
  }

  if (schemaNode.minItems !== undefined && Array.isArray(value) && value.length < schemaNode.minItems) {
    errors.push(`${path} must contain at least ${schemaNode.minItems} item(s).`);
  }

  if (schemaNode.type === 'object' && value && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (Array.isArray(schemaNode.required)) {
      for (const requiredKey of schemaNode.required) {
        if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
          errors.push(`${path}.${requiredKey} is required.`);
        }
      }
    }

    if (schemaNode.additionalProperties === false && schemaNode.properties) {
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(schemaNode.properties, key)) {
          errors.push(`${path}.${key} is not allowed by the schema.`);
        }
      }
    }

    if (schemaNode.properties) {
      for (const [key, childSchema] of Object.entries(schemaNode.properties)) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          walk(value[key], childSchema, `${path}.${key}`, errors);
        }
      }
    }
  }

  if (schemaNode.type === 'array' && Array.isArray(value) && schemaNode.items) {
    for (let index = 0; index < value.length; index += 1) {
      walk(value[index], schemaNode.items, `${path}[${index}]`, errors);
    }
  }
}

function matchesType(value, type) {
  if (Array.isArray(type)) return type.some((item) => matchesType(value, item));
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}
