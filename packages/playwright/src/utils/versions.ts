export type Version = {
  major: number;
  minor: number;
  patch: number;
  preReleaseLabel?: string;
  preReleaseType?: string;
  preReleaseIncrement?: number;
};

const pattern = /([0-9]+)\.([0-9]+)\.([0-9]+)(-(([a-z]+)([.-]([0-9]+))?)?)?/;

export function parseVersion(version: string): Version {
  if (!version) {
    throw new Error('invalid version string');
  }

  const match = version.match(pattern);
  if (!match) {
    throw new Error(`invalid version format`);
  }

  const ver: Version = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };

  // If no pre-release part, return
  if (!match[5]) {
    return ver;
  }

  ver.preReleaseLabel = match[5];
  ver.preReleaseType = match[6];

  // If no pre-release increment, return
  if (!match[8]) {
    return ver;
  }

  ver.preReleaseIncrement = Number(match[8]);

  return ver;
}
