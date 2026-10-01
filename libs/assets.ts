import fs from 'fs';
import path from 'path';

export interface AssetManifest {
  storefrontJs: string;
  storefrontCss: string;
}

const defaultManifest: AssetManifest = {
  storefrontJs: '/javascripts/storefront/bundle.min.js',
  storefrontCss: '/stylesheets/storefront/compiled.css',
};

export function loadAssetManifest(manifestPath: string = path.resolve('public/asset-manifest.json')): AssetManifest {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Partial<AssetManifest>;
    if (typeof parsed.storefrontJs === 'string' && typeof parsed.storefrontCss === 'string') return parsed as AssetManifest;
  } catch {
    return defaultManifest;
  }
  return defaultManifest;
}
