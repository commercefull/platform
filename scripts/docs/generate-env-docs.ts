/**
 * Generate configuration reference markdown from .env.example
 *
 * Parses the .env.example file, extracting variable names, values, and
 * preceding comment lines as descriptions. Outputs a markdown table
 * grouped by section (comment lines starting with #).
 *
 * Usage: tsx scripts/docs/generate-env-docs.ts
 */

import fs from 'fs';
import path from 'path';

const ENV_EXAMPLE = path.resolve(__dirname, '../../.env.example');
const OUTPUT = path.resolve(__dirname, '../../docs/generated/configuration.md');

interface EnvVar {
  name: string;
  value: string;
  description: string;
  section: string;
}

function parseEnvFile(content: string): EnvVar[] {
  const lines = content.split('\n');
  const result: EnvVar[] = [];
  let currentSection = 'General';
  let pendingComments: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      pendingComments = [];
      continue;
    }

    if (trimmed.startsWith('#')) {
      const comment = trimmed.replace(/^#+\s*/, '');

      if (!comment.includes('=') && !comment.includes('_')) {
        currentSection = comment;
      }

      pendingComments.push(comment);
      continue;
    }

    if (trimmed.includes('=')) {
      const eqIndex = trimmed.indexOf('=');
      const name = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();

      result.push({
        name,
        value,
        description: pendingComments.join(' ').trim() || '—',
        section: currentSection,
      });

      pendingComments = [];
    }
  }

  return result;
}

function generateMarkdown(vars: EnvVar[]): string {
  const sections = new Map<string, EnvVar[]>();

  for (const v of vars) {
    if (!sections.has(v.section)) {
      sections.set(v.section, []);
    }
    sections.get(v.section)!.push(v);
  }

  let md = '# Configuration Reference\n\n';
  md += '> Auto-generated from `.env.example`. Do not edit manually.\n';
  md += '> Run `yarn docs:env` to regenerate.\n\n';

  for (const [section, sectionVars] of sections) {
    md += `## ${section}\n\n`;
    md += '| Variable | Default | Description |\n';
    md += '|---|---|---|\n';

    for (const v of sectionVars) {
      const value = v.value || '—';
      const displayValue = value.length > 60 ? value.substring(0, 57) + '...' : value;
      md += `| \`${v.name}\` | \`${displayValue}\` | ${v.description} |\n`;
    }

    md += '\n';
  }

  return md;
}

function main(): void {
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error(`[docs:env] ${ENV_EXAMPLE} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
  const vars = parseEnvFile(content);
  const markdown = generateMarkdown(vars);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, markdown);
  console.log(`[docs:env] Generated ${OUTPUT} (${vars.length} variables)`);
}

main();
