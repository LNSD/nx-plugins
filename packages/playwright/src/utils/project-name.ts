import { names } from '@nrwl/devkit';
import { basename } from 'path';

export function getUnscopedLibName(libRoot: string) {
  return basename(libRoot);
}

export function filePathPrefix(directory: string) {
  const { fileName } = names(directory);
  return fileName.replace(new RegExp('/', 'g'), '-');
}

export function getE2eProjectName(
  targetProjectName: string,
  targetLibRoot: string,
  playwrightDirectory?: string,
) {
  let projectName = targetProjectName;
  if (playwrightDirectory) {
    const prefix = filePathPrefix(playwrightDirectory);
    const libName = getUnscopedLibName(targetLibRoot);
    projectName = `${prefix}-${libName}`;
  }
  return `${projectName}-e2e`;
}
