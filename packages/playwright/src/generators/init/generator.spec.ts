import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { playwrightVersion } from '../../utils/playwright-version';
import { playwrightInitGenerator } from './generator';

describe('playwright/generators#init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add dependencies into `package.json` file', async () => {
    /* Given */
    const existing = 'existing';
    const existingVersion = '1.0.0';
    updateJson(tree, 'package.json', (json) => {
      json.dependencies['@lnsd/nx-playwright'] = playwrightVersion;

      json.dependencies[existing] = existingVersion;
      json.devDependencies[existing] = existingVersion;
      return json;
    });

    /* When */
    playwrightInitGenerator(tree, {});

    /* Then */
    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.devDependencies.playwright).toBeDefined();
    expect(packageJson.devDependencies['@lnsd/nx-playwright']).toBeDefined();
    expect(packageJson.devDependencies[existing]).toBeDefined();
    expect(packageJson.dependencies['@lnsd/nx-playwright']).toBeUndefined();
    expect(packageJson.dependencies[existing]).toBeDefined();
  });
});
