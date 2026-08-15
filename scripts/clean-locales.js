#!/usr/bin/env node
/**
 * Removes orphaned translation keys — keys that exist in locale JSON files
 * but are no longer referenced in any EJS template or TypeScript file.
 *
 * Scans web/ and modules/ for t('namespace:key') and t('key') calls,
 * builds a reference set, then prunes unreferenced keys from all locale dirs.
 *
 * Usage:
 *   node scripts/clean-locales.js          # Dry-run (report only)
 *   node scripts/clean-locales.js --write  # Actually remove orphaned keys
 *
 * Re-run safely anytime. Always run dry-run first to review what gets removed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'locales');
const WRITE = process.argv.includes('--write');

// ── Collect all t() calls from source files ────────────────────────────────

function findFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Match t('ns:key'), t("ns:key"), t('key'), t("key"), req.t('...'), i18n.t('...')
// Also matches t('ns:key', {...}) — captures only the key part
const T_CALL_REGEX = /\bt\(\s*['"]([^'"]{1,120})['"]/g;

function collectReferencedKeys() {
  const referenced = new Set();
  const files = [
    ...findFiles(path.join(ROOT, 'web'), ['.ejs', '.ts']),
    ...findFiles(path.join(ROOT, 'modules'), ['.ts']),
  ];

  // Also scan app.ts at root
  const appTsPath = path.join(ROOT, 'app.ts');
  if (fs.existsSync(appTsPath)) files.push(appTsPath);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    T_CALL_REGEX.lastIndex = 0;
    while ((match = T_CALL_REGEX.exec(content)) !== null) {
      const key = match[1];
      // Skip dynamic-looking keys (contain ${, <%=, spaces, or are empty)
      if (!key || key.includes('${') || key.includes('<%') || key.includes(' ') || key.includes('+')) {
        continue;
      }
      // Keys without a namespace belong to the default 'shared' namespace
      if (key.includes(':')) {
        referenced.add(key);
      } else {
        referenced.add('shared:' + key);
      }
    }
  }

  return referenced;
}

// ── Flatten / unflatten JSON helpers ────────────────────────────────────────

function flatten(obj, prefix) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flatten(v, fullKey));
    } else {
      result[fullKey] = v;
    }
  }
  return result;
}

function setNested(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function removeNested(obj, dotPath) {
  const parts = dotPath.split('.');
  let current = obj;
  const stack = [current];
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return; // already gone
    current = current[parts[i]];
    stack.push(current);
  }
  delete current[parts[parts.length - 1]];
  // Clean up empty parent objects
  for (let i = stack.length - 2; i >= 0; i--) {
    const parent = stack[i];
    const childKey = parts[i];
    if (parent[childKey] && typeof parent[childKey] === 'object' && Object.keys(parent[childKey]).length === 0) {
      delete parent[childKey];
    } else {
      break;
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const referenced = collectReferencedKeys();
  console.log(`Referenced keys found in source: ${referenced.size}`);

  // Get all locale directories
  const localeDirs = fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  console.log(`Locale directories: ${localeDirs.join(', ')}\n`);

  let totalRemoved = 0;
  const removalReport = {}; // key -> [langs where it was found]

  // Use 'en' as the reference for which keys/namespaces exist
  const enDir = path.join(LOCALES_DIR, 'en');
  const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

  for (const lang of localeDirs) {
    const langDir = path.join(LOCALES_DIR, lang);
    let langRemoved = 0;

    for (const file of enFiles) {
      const filePath = path.join(langDir, file);
      if (!fs.existsSync(filePath)) continue;

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const flat = flatten(data, '');
      const ns = file.replace('.json', '');

      const keysToRemove = [];
      for (const flatKey of Object.keys(flat)) {
        const fullKey = `${ns}:${flatKey}`;
        if (!referenced.has(fullKey)) {
          keysToRemove.push(flatKey);
          if (!removalReport[fullKey]) removalReport[fullKey] = [];
          removalReport[fullKey].push(lang);
        }
      }

      if (keysToRemove.length === 0) continue;

      if (WRITE) {
        for (const key of keysToRemove) {
          removeNested(data, key);
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      }

      langRemoved += keysToRemove.length;
    }

    if (langRemoved > 0) {
      console.log(`  ${lang}: ${langRemoved} orphaned keys ${WRITE ? 'removed' : 'would be removed'}`);
      totalRemoved += langRemoved;
    }
  }

  console.log(`\n${WRITE ? 'Removed' : 'Would remove'} ${totalRemoved} orphaned keys across all locales.`);

  if (totalRemoved > 0) {
    console.log(`\nOrphaned keys (showing first 50):`);
    const orphanedKeys = Object.keys(removalReport).sort();
    for (const key of orphanedKeys.slice(0, 50)) {
      console.log(`  ${key}  (in: ${removalReport[key].join(', ')})`);
    }
    if (orphanedKeys.length > 50) {
      console.log(`  ... and ${orphanedKeys.length - 50} more`);
    }
  }

  if (!WRITE && totalRemoved > 0) {
    console.log(`\nDry-run complete. Run with --write to remove: node scripts/clean-locales.js --write`);
  }
}

main();
