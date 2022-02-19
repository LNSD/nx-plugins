import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  Tree,
  updateJson,
} from '@nrwl/devkit';

import {
  playwrightVersion,
  playwrightTestVersion,
  nxVersion,
} from '../../utils/playwright-version';
import { InitGeneratorSchema } from './schema';

function updateDependencies(tree: Tree) {
  updateJson(tree, 'package.json', (json) => {
    json.dependencies = json.dependencies || {};
    delete json.dependencies['@lnsd/nx-playwright'];

    return json;
  });

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      '@lnsd/nx-playwright': nxVersion,
      playwright: playwrightVersion,
      '@playwright/test': playwrightTestVersion,
    },
  );
}

export function playwrightInitGenerator(
  host: Tree,
  options: InitGeneratorSchema,
) {
  if (options.skipPackageJson) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }
  return updateDependencies(host);
}

export default playwrightInitGenerator;
export const playwrightInitSchematic = convertNxGenerator(
  playwrightInitGenerator,
);
