import { parseVersion, Version } from './versions';

export const nxVersion = '*';
export const playwrightVersion = '^1.18.0';
export const playwrightTestVersion = '^1.18.0';
export const eslintPluginPlaywrightVersion = '^0.8.0';

export function installedPlaywrightVersion(): Version | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const playwrightPackageJson = require('playwright/package.json');
    return parseVersion(playwrightPackageJson.version);
  } catch (ignore) {
    return null;
  }
}
