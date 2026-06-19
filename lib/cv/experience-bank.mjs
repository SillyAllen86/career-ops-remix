import { readFileSync } from 'node:fs';

export function loadExperienceBank(path) {
  return parseExperienceBank(readFileSync(path, 'utf8'));
}

export function parseExperienceBank(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections = [];

  let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (heading) {
      if (current) sections.push(current);
      current = {
        id: Number(heading[1]),
        title: heading[2].trim(),
        bullets: [],
      };
      continue;
    }

    if (!current) continue;
    if (line.startsWith('- ')) {
      current.bullets.push(stripInlineMarkdown(line.slice(2).trim()));
    }
  }

  if (current) sections.push(current);
  return { sections };
}

function stripInlineMarkdown(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
