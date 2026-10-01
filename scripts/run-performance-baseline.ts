import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const targets = (process.env.PERF_TARGETS || '50,100,250,500')
  .split(',')
  .map(value => Number(value.trim()))
  .filter(value => Number.isInteger(value) && value > 0);
const suites = (
  process.env.PERF_SUITES ||
  'load-product-browse,load-basket,load-auth,load-checkout,load-merchant,load-order-complete,load-coupon,load-storefront'
)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const outputDirectory = path.resolve('artifacts/performance', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(outputDirectory, { recursive: true });

for (const target of targets) {
  for (const suite of suites) {
    const output = path.join(outputDirectory, `${suite}-${target}vu.json`);
    const result = spawnSync('k6', ['run', '--summary-export', output, `tests/performance/${suite}.js`], {
      stdio: 'inherit',
      env: { ...process.env, TARGET_VUS: String(target) },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
