import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadAssetManifest } from './assets';

describe('loadAssetManifest', () => {
  it('should load fingerprinted asset paths when a manifest exists', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'commercefull-assets-'));
    const manifestPath = path.join(directory, 'asset-manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        storefrontJs: '/javascripts/storefront/bundle.abc123def456.js',
        storefrontCss: '/stylesheets/storefront/compiled.abc123def456.css',
      }),
    );

    expect(loadAssetManifest(manifestPath)).toEqual({
      storefrontJs: '/javascripts/storefront/bundle.abc123def456.js',
      storefrontCss: '/stylesheets/storefront/compiled.abc123def456.css',
    });
  });

  it('should use stable development paths when the manifest is unavailable', () => {
    expect(loadAssetManifest('/missing/asset-manifest.json')).toEqual({
      storefrontJs: '/javascripts/storefront/bundle.min.js',
      storefrontCss: '/stylesheets/storefront/compiled.css',
    });
  });
});
