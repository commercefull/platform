import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'asset-manifest.json');
const assets = {
  storefrontJs: path.join(publicDir, 'javascripts/storefront/bundle.min.js'),
  storefrontCss: path.join(publicDir, 'stylesheets/storefront/compiled.css'),
};

if (fs.existsSync(manifestPath)) {
  const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, string>;
  for (const assetPath of Object.values(previous)) {
    const absolutePath = path.join(publicDir, assetPath.replace(/^\//, ''));
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  }
}

const manifest: Record<string, string> = {};
for (const [name, sourcePath] of Object.entries(assets)) {
  const content = fs.readFileSync(sourcePath);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const extension = path.extname(sourcePath);
  const outputPath = sourcePath.slice(0, -extension.length) + `.${hash}${extension}`;
  fs.copyFileSync(sourcePath, outputPath);
  manifest[name] = `/${path.relative(publicDir, outputPath).split(path.sep).join('/')}`;
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
