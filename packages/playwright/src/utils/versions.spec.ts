import { parseVersion } from './versions';

describe('parseVersion', () => {
  it('parses 1.2.3', () => {
    /* Given */
    const semver = '1.2.3';

    /* When */
    const version = parseVersion(semver);

    /* Then */
    expect(version).toStrictEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('parses 10.2.03', () => {
    /* Given */
    const semver = '10.2.03';

    /* When */
    const version = parseVersion(semver);

    /* Then */
    expect(version).toStrictEqual({ major: 10, minor: 2, patch: 3 });
  });

  it('parses 1.2.3-alpha', () => {
    /* Given */
    const semver = '1.2.3-alpha';

    /* When */
    const version = parseVersion(semver);

    /* Then */
    expect(version).toStrictEqual({
      major: 1,
      minor: 2,
      patch: 3,
      preReleaseLabel: 'alpha',
      preReleaseType: 'alpha',
    });
  });

  it('parses 1.2.3-alpha.1', () => {
    /* Given */
    const semver = '1.2.3-alpha.1';

    /* When */
    const version = parseVersion(semver);

    /* Then */
    expect(version).toStrictEqual({
      major: 1,
      minor: 2,
      patch: 3,
      preReleaseLabel: 'alpha.1',
      preReleaseType: 'alpha',
      preReleaseIncrement: 1,
    });
  });

  it('parses 1.2.3-alpha-1', () => {
    /* Given */
    const semver = '1.2.3-alpha-1';

    /* When */
    const version = parseVersion(semver);

    /* Then */
    expect(version).toStrictEqual({
      major: 1,
      minor: 2,
      patch: 3,
      preReleaseLabel: 'alpha-1',
      preReleaseType: 'alpha',
      preReleaseIncrement: 1,
    });
  });

  it('throws error on empty string input', () => {
    /* Given */
    const semver = '';

    /* Then */
    function parseEmptyVersionString() {
      parseVersion(semver);
    }

    expect(parseEmptyVersionString).toThrowError('invalid version string');
  });

  it('throws error on null input', () => {
    /* Given */
    const semver = null;

    /* Then */
    function parseNullVersionString() {
      parseVersion(semver);
    }

    expect(parseNullVersionString).toThrowError('invalid version string');
  });

  it('throws error on undefined input', () => {
    /* Given */
    const semver = undefined;

    /* Then */
    function parseUndefinedVersionString() {
      parseVersion(semver);
    }

    expect(parseUndefinedVersionString).toThrowError('invalid version string');
  });

  it('throws error on invalid format version string', () => {
    /* Given */
    const semver = 'invalid';

    /* Then */
    function parseInvalidFormatVersionString() {
      parseVersion(semver);
    }

    expect(parseInvalidFormatVersionString).toThrowError(
      'invalid version format',
    );
  });
});
