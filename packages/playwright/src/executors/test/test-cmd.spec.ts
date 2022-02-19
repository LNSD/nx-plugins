import faker from '@faker-js/faker';

import { buildTestCommand } from './test-cmd';

// Mock child_process, so we can verify tasks are (or are not) invoked as we expect
jest.mock('child_process');

/**
 * See `__mocks__/child_process.js`.
 */
interface SpawnMockConfig {
  emitError: boolean;
  returnCode: number;
}

interface ChildProcessModuleMock {
  /**
   * Initialize the `spawn` mock behavior.
   */
  __setSpawnMockConfig(config?: Partial<SpawnMockConfig>): void;

  spawn: jest.Mock;
}

/**
 * Configure the `child_process` `spawn` mock for these tests.
 * This relies on the mock implementation in `__mocks__/child_process.js`.
 */
function setSpawnMock(options?: Partial<SpawnMockConfig>): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cpMocked: ChildProcessModuleMock = require('child_process');
  cpMocked.__setSpawnMockConfig(options);

  const spawnMock: jest.Mock = cpMocked.spawn;
  spawnMock.mockName('spawn');
  return spawnMock;
}

describe('cli-wrapper/test', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should map test options to cli arguments', () => {
    /* Given */
    const spawnMock: jest.Mock = setSpawnMock();
    const config = faker.system.filePath();
    const output = faker.system.directoryPath();
    const file = faker.system.filePath();

    const runCmd = buildTestCommand(
      {
        config,
        output,
        browser: 'firefox',
        headed: true,
        debug: true,
        workers: 1,
      },
      file,
    );

    /* When */
    runCmd();

    /* Then */
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenLastCalledWith(
      'npx',
      [
        'playwright',
        'test',
        '--headed',
        '--browser',
        'firefox',
        '--debug',
        '--config',
        config,
        '--output',
        output,
        '--workers',
        '1',
        file,
      ],
      {},
    );
  });
});
