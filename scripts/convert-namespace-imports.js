#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function findFiles(dir, results) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(full, results);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes('import * as')) {
        results.push(full);
      }
    }
  }
}

const files = [];
for (const d of ['modules', 'web', 'libs', 'boot']) {
  findFiles(path.join(ROOT, d), files);
}

const BUILTINS = new Set(['crypto', 'fs', 'path', 'util', 'stream', 'http', 'https', 'url', 'zlib', 'os', 'net', 'dns', 'child_process', 'cluster', 'events', 'assert', 'querystring', 'readline', 'repl', 'tls', 'dgram', 'vm', 'worker_threads', 'console', 'process']);

let totalConverted = 0;
let totalSkipped = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  const importRegex = /import \* as (\w+) from ['"]([^'"]+)['"];/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const [fullLine, ns, modulePath] = match;
    const baseModule = modulePath.replace(/^node:/, '');
    if (BUILTINS.has(baseModule)) {
      totalSkipped++;
      continue;
    }

    const usageRegex = new RegExp(`\\b${ns}\\.(\\w+)`, 'g');
    const identifiers = new Set();
    let usageMatch;
    const contentWithoutImports = content.replace(/import \* as \w+ from ['"][^'"]+['"];/g, '');
    while ((usageMatch = usageRegex.exec(contentWithoutImports)) !== null) {
      identifiers.add(usageMatch[1]);
    }

    if (identifiers.size === 0) continue;

    const sortedIds = [...identifiers].sort();
    const namedImport = `import { ${sortedIds.join(', ')} } from '${modulePath}';`;
    content = content.replace(fullLine, namedImport);

    for (const id of sortedIds) {
      const nsIdRegex = new RegExp(`\\b${ns}\\.${id}\\b`, 'g');
      content = content.replace(nsIdRegex, id);
    }

    modified = true;
    totalConverted++;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Converted: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. ${totalConverted} namespace imports converted, ${totalSkipped} built-in imports skipped.`);
